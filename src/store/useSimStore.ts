import { create } from 'zustand'
import type { Alarm, EventItem, GravityFlowMap, PipeFillMap, PipeFlowMap, Pump, ShipCondition, SystemStatus, Tank, Valve } from '../simulation/types'

const now=()=>new Date().toLocaleTimeString('ja-JP',{hour12:false})
const mkValve=(id:string,name:string,kind:'isolation'|'control'='isolation',opening=0,travelTime?:number):Valve=>({id,name,kind,opening,target:opening,travelTime:travelTime??(kind==='control'?14:6),state:opening>99?'open':'closed'})
const tankIds=['P1','P2','P3','P4','S1','S2','S3','S4'] as const
const pumpIds=['BP1','BP2','BP3'] as const
const WATER_DENSITY=1.025, BASE_DISPLACEMENT=52000, BASE_MEAN_DRAFT=7.90, BASE_TRIM=-0.20, BASE_GM=2.20, TPC=48, MCTC=650, LBP=180
const TANK_TIME_COMPRESSION=12, GRAVITY_TIME_COMPRESSION=12, PIPE_WET_RATE=1.6, PIPE_DRAIN_RATE=.04
const openFrac=(v:Valve|undefined)=>v?Math.max(0,Math.min(1,v.opening/100)):0
const isOpen=(v:Valve|undefined,min=5)=>!!v&&v.opening>min
const sideOf=(id:string)=>id.startsWith('P')?'P':'S'

type Side='P'|'S'
interface SimState{
 valves:Record<string,Valve>;pumps:Record<string,Pump>;tanks:Record<string,Tank>;pipeFill:PipeFillMap;pipeFlow:PipeFlowMap;gravityFlow:GravityFlowMap;
 shipCondition:ShipCondition;systemStatus:SystemStatus;alarms:Alarm[];events:EventItem[];training:boolean;speed:number;paused:boolean;selectedValve:string|null;selectedPump:string|null;
 setValveTarget:(id:string,target:number)=>void;toggleValve:(id:string)=>void;setSelectedValve:(id:string|null)=>void;togglePump:(id:string)=>void;setPumpSpeed:(id:string,target:number)=>void;setSelectedPump:(id:string|null)=>void;ackAlarm:(id:string)=>void;setTraining:(v:boolean)=>void;setSpeed:(v:number)=>void;setPaused:(v:boolean)=>void;tick:(dt:number)=>void;reset:()=>void
}

const tankRows:Array<[string,string,Tank['side'],number,number,number,number,number,number,number,number]>=[
 ['P1','No.1 WBT (P)','port',1200,720,45,-12,24,9.2,8.6,.45],['P2','No.2 WBT (P)','port',1450,870,15,-13,28,9.8,8.8,.45],['P3','No.3 WBT (P)','port',1550,930,-20,-13,30,10,9,.45],['P4','No.4 WBT (P)','port',1350,810,-50,-12,26,9.5,8.7,.45],
 ['S1','No.1 WBT (S)','starboard',1200,720,45,12,24,9.2,8.6,.45],['S2','No.2 WBT (S)','starboard',1450,870,15,13,28,9.8,8.8,.45],['S3','No.3 WBT (S)','starboard',1550,930,-20,13,30,10,9,.45],['S4','No.4 WBT (S)','starboard',1350,810,-50,12,26,9.5,8.7,.45]
]
const initialVolume:Record<string,number>=Object.fromEntries(tankRows.map(r=>[r[0],r[4]]))
const initialTanks=():Record<string,Tank>=>Object.fromEntries(tankRows.map(([id,name,side,capacity,volume,lcg,tcg,fsLength,fsBreadth,tankHeight,bottomElevation])=>[id,{id,name,side,capacity,volume,lcg,tcg,fsLength,fsBreadth,tankHeight,bottomElevation}]))
const initialValves=()=>{
 const a:Valve[]=[mkValve('V-HSC','HIGH SEA CHEST isolation'),mkValve('V-LSC','LOW SEA CHEST isolation'),mkValve('V-P-SUC','PORT MAIN → COMMON SUCTION'),mkValve('V-S-SUC','STBD MAIN → COMMON SUCTION'),mkValve('V-P-DIS','COMMON DISCHARGE → PORT MAIN'),mkValve('V-S-DIS','COMMON DISCHARGE → STBD MAIN'),mkValve('V-X-P','PORT side vertical bypass'),mkValve('V-X-S','STBD side vertical bypass'),mkValve('V-OB','COMMON DISCHARGE → OVERBOARD')]
 tankIds.forEach(id=>a.push(mkValve(`V-${id}-T`,`${id} reversible tank valve`)))
 pumpIds.forEach(id=>{a.push(mkValve(`V-${id}-S`,`${id} suction isolation`));a.push(mkValve(`V-${id}-D`,`${id} discharge isolation / throttling`,'control'))})
 return Object.fromEntries(a.map(v=>[v.id,v]))
}
const initialPumps=():Record<string,Pump>=>Object.fromEntries(pumpIds.map((id,i)=>[id,{id,name:`Ballast Pump No.${i+1}`,running:false,trip:false,rpm:0,ratedRpm:1480,speedTarget:id==='BP1'?65:100,vfd:id==='BP1',flow:0,suctionPressure:0,dischargePressure:0,current:0,temperature:28}]))
const pipeKeys=['PM_MAIN','SM_MAIN','PM_SUC','SM_SUC','SUCTION_HEADER','HSC','LSC','DISCHARGE_HEADER','PM_DIS','SM_DIS','X_P','X_S','OB',...tankIds.map(id=>`${id}_BR`),...pumpIds.flatMap(id=>[`${id}_IN`,`${id}_OUT`])]
const initialPipeFill=():PipeFillMap=>Object.fromEntries(pipeKeys.map(k=>[k,0]))
const initialPipeFlow=():PipeFlowMap=>Object.fromEntries(pipeKeys.map(k=>[k,0]))
const initialGravityFlow=():GravityFlowMap=>Object.fromEntries(tankIds.map(k=>[k,0]))
const idle=():SystemStatus=>({mode:'IDLE',source:'—',sink:'—',totalFlow:0,portMainFlow:0,stbdMainFlow:0})
function addEvent(a:EventItem[],message:string){return [{id:crypto.randomUUID(),time:now(),message},...a].slice(0,100)}
function addAlarm(a:Alarm[],severity:Alarm['severity'],message:string){const i=a.findIndex(x=>x.message===message);if(i>=0){const b=[...a];b[i]={...b[i],severity,active:true};return b}return [{id:crypto.randomUUID(),severity,message,ack:false,active:true,time:now()},...a].slice(0,50)}

export function calculateShipCondition(tanks:Record<string,Tank>):ShipCondition{
 let dmSum=0,tm=0,lm=0,fsm=0,slack=0
 for(const id of tankIds){const t=tanks[id],dm=(t.volume-initialVolume[id])*WATER_DENSITY;dmSum+=dm;tm+=dm*t.tcg;lm+=dm*t.lcg;const f=t.volume/t.capacity,edge=Math.min(1,Math.max(0,Math.min(f/.08,(1-f)/.08)));if(f>.02&&f<.98)slack++;fsm+=WATER_DENSITY*t.fsLength*Math.pow(t.fsBreadth,3)/12*edge}
 const displacement=Math.max(1000,BASE_DISPLACEMENT+dmSum),fsc=fsm/displacement,effectiveGM=Math.max(.05,BASE_GM-fsc),heelRad=Math.atan2(tm,displacement*effectiveGM),heelDeg=Math.abs(heelRad*180/Math.PI),heelSide:ShipCondition['heelSide']=heelDeg<.01?'UPRIGHT':heelRad>0?'STBD':'PORT'
 const meanDraft=BASE_MEAN_DRAFT+(dmSum/TPC)/100,trimM=BASE_TRIM+(lm/MCTC)/100,trimDirection:ShipCondition['trimDirection']=Math.abs(trimM)<.01?'EVEN':trimM>0?'BY BOW':'BY STERN',draftF=meanDraft+trimM/2,draftA=meanDraft-trimM/2,stabilityStatus:ShipCondition['stabilityStatus']=effectiveGM<.35?'CRITICAL':effectiveGM<.75?'LOW GM':effectiveGM<1.2?'CAUTION':'NORMAL'
 return {heelDeg,heelSide,trimM,trimDirection,draftF,draftA,meanDraft,displacement,baseGM:BASE_GM,effectiveGM,freeSurfaceCorrection:fsc,totalFSM:fsm,slackTankCount:slack,stabilityStatus}
}

const openTankIds=(side:Side,valves:Record<string,Valve>,tanks:Record<string,Tank>,source:boolean)=>tankIds.filter(id=>sideOf(id)===side&&isOpen(valves[`V-${id}-T`],8)&&(source?tanks[id].volume>3:tanks[id].volume<tanks[id].capacity-3))
const distribute=(tanks:Record<string,Tank>,ids:readonly string[],dv:number,sign:1|-1)=>{if(!ids.length)return;const each=dv/ids.length;ids.forEach(id=>tanks[id]={...tanks[id],volume:Math.max(0,Math.min(tanks[id].capacity,tanks[id].volume+sign*each))})}

export const useSimStore=create<SimState>((set,get)=>({
 valves:initialValves(),pumps:initialPumps(),tanks:initialTanks(),pipeFill:initialPipeFill(),pipeFlow:initialPipeFlow(),gravityFlow:initialGravityFlow(),shipCondition:calculateShipCondition(initialTanks()),systemStatus:idle(),alarms:[],events:[],training:true,speed:1,paused:false,selectedValve:null,selectedPump:null,
 setValveTarget:(id,target)=>set(s=>{const v=s.valves[id];if(!v)return s;const t=Math.max(0,Math.min(100,target));return {valves:{...s.valves,[id]:{...v,target:t}},events:addEvent(s.events,`${id} COMMAND ${t.toFixed(0)}%`)}}),
 toggleValve:id=>{const v=get().valves[id];if(v)get().setValveTarget(id,v.target>50?0:100)},setSelectedValve:id=>set({selectedValve:id}),
 togglePump:id=>set(s=>{const p=s.pumps[id];if(!p)return s;if(p.trip)return {events:addEvent(s.events,`${id} START BLOCKED: TRIPPED`)};const running=!p.running;return {pumps:{...s.pumps,[id]:{...p,running}},events:addEvent(s.events,`${id} ${running?'START':'STOP'} COMMAND`)}}),
 setPumpSpeed:(id,target)=>set(s=>{const p=s.pumps[id];if(!p||!p.vfd)return s;const v=Math.max(30,Math.min(100,target));return {pumps:{...s.pumps,[id]:{...p,speedTarget:v}},events:addEvent(s.events,`${id} VFD COMMAND ${v.toFixed(0)}%`)}}),setSelectedPump:id=>set({selectedPump:id}),ackAlarm:id=>set(s=>({alarms:s.alarms.map(a=>a.id===id?{...a,ack:true}:a)})),setTraining:v=>set({training:v}),setSpeed:v=>set({speed:v}),setPaused:v=>set({paused:v}),
 reset:()=>{const tanks=initialTanks();set({valves:initialValves(),pumps:initialPumps(),tanks,pipeFill:initialPipeFill(),pipeFlow:initialPipeFlow(),gravityFlow:initialGravityFlow(),shipCondition:calculateShipCondition(tanks),systemStatus:idle(),alarms:[],events:[],selectedValve:null,selectedPump:null,paused:false,speed:1})},
 tick:dt=>set(s=>{
  if(s.paused)return s
  const k=dt*s.speed,valves={...s.valves},pumps={...s.pumps},tanks={...s.tanks},pipeFlow:PipeFlowMap=Object.fromEntries(pipeKeys.map(k=>[k,0])),pipeFill={...s.pipeFill},gravityFlow:GravityFlowMap=Object.fromEntries(tankIds.map(k=>[k,0]));let alarms=s.alarms.map(a=>({...a,active:false})),events=s.events
  for(const [id,v0] of Object.entries(valves) as [string,Valve][]){const v:Valve={...v0};if(Math.abs(v.target-v.opening)>.05){const step=100/Math.max(.2,v.travelTime)*k;v.opening+=Math.sign(v.target-v.opening)*Math.min(step,Math.abs(v.target-v.opening));v.state=v.target>v.opening?'opening':'closing'}else{v.opening=v.target;v.state=v.opening>99?'open':'closed'}valves[id]=v}

  const seaOpen=isOpen(valves['V-HSC'],8)||isOpen(valves['V-LSC'],8),pSuc=isOpen(valves['V-P-SUC'],8),sSuc=isOpen(valves['V-S-SUC'],8),pDis=isOpen(valves['V-P-DIS'],8),sDis=isOpen(valves['V-S-DIS'],8),ob=isOpen(valves['V-OB'],8)
  const pSources=openTankIds('P',valves,tanks,true),sSources=openTankIds('S',valves,tanks,true),pSinks=openTankIds('P',valves,tanks,false),sSinks=openTankIds('S',valves,tanks,false)
  const srcP=pSuc&&pSources.length>0,srcS=sSuc&&sSources.length>0,dstP=pDis&&pSinks.length>0,dstS=sDis&&sSinks.length>0
  const sourceCats=(seaOpen?1:0)+(srcP?1:0)+(srcS?1:0),sinkCats=(ob?1:0)+(dstP?1:0)+(dstS?1:0)
  const pumpRequested=pumpIds.some(id=>pumps[id].running)
  // Hard conflicts are only hydraulically contradictory line-ups. Multiple PORT/STBD tank sources or destinations are valid on a common header.
  const wrongLoop=(pSuc&&pDis)||(sSuc&&sDis)
  const mixedSeaTankSource=seaOpen&&(srcP||srcS)
  const mixedOverboardTankSink=ob&&(dstP||dstS)
  const pumpConflict=pumpRequested&&(wrongLoop||mixedSeaTankSource||mixedOverboardTankSink)
  if(wrongLoop&&pumpRequested)alarms=addAlarm(alarms,'WARNING','SAME SIDE MAIN OPEN TO BOTH COMMON SUCTION AND COMMON DISCHARGE')
  if(mixedSeaTankSource&&pumpRequested)alarms=addAlarm(alarms,'WARNING','SEA CHEST AND BALLAST TANKS CONNECTED TO COMMON SUCTION — VERIFY / ISOLATE ONE SOURCE TYPE')
  if(mixedOverboardTankSink&&pumpRequested)alarms=addAlarm(alarms,'WARNING','OVERBOARD AND BALLAST TANKS CONNECTED TO COMMON DISCHARGE — VERIFY / ISOLATE ONE DESTINATION TYPE')
  if(isOpen(valves['V-X-P'],8)&&pumpRequested)alarms=addAlarm(alarms,'CAUTION','PORT BYPASS OPEN DURING PUMP OPERATION — VERIFY LINE-UP')
  if(isOpen(valves['V-X-S'],8)&&pumpRequested)alarms=addAlarm(alarms,'CAUTION','STBD BYPASS OPEN DURING PUMP OPERATION — VERIFY LINE-UP')

  const hasSource=sourceCats>=1,hasSink=sinkCats>=1
  let totalFlow=0
  for(const id of pumpIds){const p={...pumps[id]},suc=isOpen(valves[`V-${id}-S`],8),dis=openFrac(valves[`V-${id}-D`]),speedPct=p.vfd?p.speedTarget:100,targetRpm=p.ratedRpm*speedPct/100
   if(p.running&&!p.trip){p.rpm+=Math.sign(targetRpm-p.rpm)*Math.min(Math.abs(targetRpm-p.rpm),850*k);const speedRatio=p.rpm/p.ratedRpm,ready=p.rpm>p.ratedRpm*.25&&suc&&dis>.02&&hasSource&&hasSink&&!pumpConflict;const qRated=900;const qTarget=ready?qRated*speedRatio*Math.pow(dis,.58):0;p.flow+=Math.sign(qTarget-p.flow)*Math.min(Math.abs(qTarget-p.flow),1200*k);p.suctionPressure=ready?.16:0.02;p.dischargePressure=ready?.60*speedRatio*speedRatio-.18*Math.min(1,p.flow/qRated):.04;p.current=ready?Math.min(145,25+72*Math.pow(speedRatio,3)+15*(p.flow/qRated)):Math.min(150,15+p.rpm/14);p.temperature=Math.min(95,p.temperature+(ready?.025:.05)*k)
    if(!suc||!hasSource){p.flow=0;alarms=addAlarm(alarms,'WARNING',`${id} LOW SUCTION / DRY RUNNING`)}
    if(p.rpm<p.ratedRpm*.55&&dis>.8&&!p.vfd){p.current=Math.max(p.current,140);alarms=addAlarm(alarms,'WARNING',`${id} HIGH STARTING CURRENT — DISCHARGE VALVE TOO FAR OPEN`)}
    if(p.current>146){p.trip=true;p.running=false;p.flow=0;alarms=addAlarm(alarms,'TRIP',`${id} OVERCURRENT TRIP`);events=addEvent(events,`${id} TRIPPED BY OVERCURRENT`)}
    if(hasSource&&!hasSink)alarms=addAlarm(alarms,'WARNING',`${id} DEADHEAD — NO DISCHARGE DESTINATION`)
   }else{p.rpm=Math.max(0,p.rpm-700*k);p.flow=Math.max(0,p.flow-1200*k);p.current=Math.max(0,p.current-130*k);p.suctionPressure=Math.max(0,p.suctionPressure-.5*k);p.dischargePressure=Math.max(0,p.dischargePressure-.5*k);p.temperature=Math.max(28,p.temperature-.08*k)}
   pumps[id]=p;totalFlow+=p.flow
  }

  let mode:SystemStatus['mode']='IDLE',source='—',sink='—'
  if(pumpConflict&&pumpRequested)mode='CONFLICT'
  else if(totalFlow>1&&seaOpen&&(dstP||dstS)){mode='BALLAST';source='SEA CHEST';sink=[dstP?'PORT':'',dstS?'STBD':''].filter(Boolean).join('+')+' TANKS'}
  else if(totalFlow>1&&(srcP||srcS)&&ob){mode='DEBALLAST';source=[srcP?'PORT':'',srcS?'STBD':''].filter(Boolean).join('+')+' TANKS';sink='OVERBOARD'}
  else if(totalFlow>1&&(srcP||srcS)&&(dstP||dstS)){mode='TRANSFER';source=srcP?'PORT TANKS':'STBD TANKS';sink=dstP?'PORT TANKS':'STBD TANKS'}
  else if(pumpRequested&&totalFlow<1)mode='DEADHEAD'

  const dv=totalFlow/3600*k*TANK_TIME_COMPRESSION
  // One pump total-flow is shared across every open tank branch; do not duplicate total flow on PORT and STBD.
  const activeSourceTanks=[...(srcP?pSources:[]),...(srcS?sSources:[])]
  const activeSinkTanks=[...(dstP?pSinks:[]),...(dstS?sSinks:[])]
  if(mode==='BALLAST')distribute(tanks,activeSinkTanks,dv,1)
  if(mode==='DEBALLAST')distribute(tanks,activeSourceTanks,dv,-1)
  if(mode==='TRANSFER'){distribute(tanks,activeSourceTanks,dv,-1);distribute(tanks,activeSinkTanks,dv,1)}

  if(totalFlow>1&&!pumpConflict){
   pipeFlow.SUCTION_HEADER=totalFlow;pipeFlow.DISCHARGE_HEADER=totalFlow;pumpIds.forEach(id=>{if(pumps[id].flow>1){pipeFlow[`${id}_IN`]=pumps[id].flow;pipeFlow[`${id}_OUT`]=pumps[id].flow}})
   if(seaOpen){if(isOpen(valves['V-HSC']))pipeFlow.HSC=totalFlow;if(isOpen(valves['V-LSC']))pipeFlow.LSC=totalFlow}
   const nSrc=Math.max(1,activeSourceTanks.length),nDst=Math.max(1,activeSinkTanks.length)
   const qSrcP=srcP?totalFlow*pSources.length/nSrc:0,qSrcS=srcS?totalFlow*sSources.length/nSrc:0
   const qDstP=dstP?totalFlow*pSinks.length/nDst:0,qDstS=dstS?totalFlow*sSinks.length/nDst:0
   if(srcP){pipeFlow.PM_SUC=qSrcP;pipeFlow.PM_MAIN=-qSrcP;pSources.forEach(id=>pipeFlow[`${id}_BR`]=qSrcP/pSources.length)}
   if(srcS){pipeFlow.SM_SUC=qSrcS;pipeFlow.SM_MAIN=-qSrcS;sSources.forEach(id=>pipeFlow[`${id}_BR`]=qSrcS/sSources.length)}
   if(dstP){pipeFlow.PM_DIS=qDstP;pipeFlow.PM_MAIN=qDstP;pSinks.forEach(id=>pipeFlow[`${id}_BR`]=-qDstP/pSinks.length)}
   if(dstS){pipeFlow.SM_DIS=qDstS;pipeFlow.SM_MAIN=qDstS;sSinks.forEach(id=>pipeFlow[`${id}_BR`]=-qDstS/sSinks.length)}
   if(ob)pipeFlow.OB=totalFlow
  }

  // Gravity through a stopped centrifugal pump: HSC/LSC -> common suction -> stopped pump -> common discharge -> side main -> tank.
  // The stopped pump is a passive resistance, not a closed valve. At least one stopped pump must have both isolations open.
  const stoppedPass=pumpIds.filter(id=>!pumps[id].running&&pumps[id].rpm<30&&isOpen(valves[`V-${id}-S`],8)&&isOpen(valves[`V-${id}-D`],8))
  const pre=calculateShipCondition(tanks);let gTotal=0
  if(!pumpRequested&&seaOpen&&stoppedPass.length&&(dstP||dstS)){
   const targets=[...(dstP?pSinks:[]),...(dstS?sSinks:[])]
   for(const id of targets){const t=tanks[id],level=t.tankHeight*(t.volume/t.capacity),tankSurface=t.bottomElevation+level,localDraft=pre.meanDraft+pre.trimM*(t.lcg/LBP),head=localDraft-tankSurface;if(head>.05){const q=Math.min(500,360*Math.sqrt(head));gravityFlow[id]=q;gTotal+=q;distribute(tanks,[id],q/3600*k*GRAVITY_TIME_COMPRESSION,1);pipeFlow[`${id}_BR`]=-q}}
   if(gTotal>1){mode='GRAVITY FILL';source='SEA CHEST';sink='BALLAST TANKS';pipeFlow.SUCTION_HEADER=gTotal;pipeFlow.DISCHARGE_HEADER=gTotal;if(isOpen(valves['V-HSC']))pipeFlow.HSC=gTotal;if(isOpen(valves['V-LSC']))pipeFlow.LSC=gTotal;const pass=stoppedPass[0];pipeFlow[`${pass}_IN`]=gTotal;pipeFlow[`${pass}_OUT`]=gTotal;if(dstP){pipeFlow.PM_DIS=gTotal;pipeFlow.PM_MAIN=gTotal}if(dstS){pipeFlow.SM_DIS=gTotal;pipeFlow.SM_MAIN=gTotal}totalFlow=gTotal}
  }
  // Gravity discharge / side-to-side transfer can occur directly through the common suction header when pump is stopped.
  if(!pumpRequested&&gTotal<1){
   const seaGravity=(srcP||srcS)&&seaOpen
   if(seaGravity){const sources=srcP?pSources:sSources;let q=0;for(const id of sources){const t=tanks[id],level=t.tankHeight*(t.volume/t.capacity),tankSurface=t.bottomElevation+level,localDraft=pre.meanDraft+pre.trimM*(t.lcg/LBP),head=tankSurface-localDraft;if(head>.05){const qi=Math.min(450,330*Math.sqrt(head));gravityFlow[id]=-qi;q+=qi;distribute(tanks,[id],qi/3600*k*GRAVITY_TIME_COMPRESSION,-1);pipeFlow[`${id}_BR`]=qi}}if(q>1){mode='GRAVITY DISCHARGE';source='TANK';sink='SEA CHEST';totalFlow=q;pipeFlow.SUCTION_HEADER=q;if(srcP){pipeFlow.PM_SUC=q;pipeFlow.PM_MAIN=-q}if(srcS){pipeFlow.SM_SUC=q;pipeFlow.SM_MAIN=-q}if(isOpen(valves['V-HSC']))pipeFlow.HSC=-q;if(isOpen(valves['V-LSC']))pipeFlow.LSC=-q}}
   const directPS=srcP&&sSuc&&sSinks.length, directSP=srcS&&pSuc&&pSinks.length
   if((directPS||directSP)&&isOpen(valves[directPS?'V-X-P':'V-X-S'],8)){
    const from=directPS?pSources:sSources,to=directPS?sSinks:pSinks;const srcLevel=Math.max(...from.map(id=>tanks[id].bottomElevation+tanks[id].tankHeight*tanks[id].volume/tanks[id].capacity)),dstLevel=Math.min(...to.map(id=>tanks[id].bottomElevation+tanks[id].tankHeight*tanks[id].volume/tanks[id].capacity)),head=srcLevel-dstLevel;if(head>.05){const q=Math.min(420,300*Math.sqrt(head));mode='GRAVITY TRANSFER';source=directPS?'PORT TANKS':'STBD TANKS';sink=directPS?'STBD TANKS':'PORT TANKS';totalFlow=q;distribute(tanks,from,q/3600*k*GRAVITY_TIME_COMPRESSION,-1);distribute(tanks,to,q/3600*k*GRAVITY_TIME_COMPRESSION,1);pipeFlow.SUCTION_HEADER=q;if(directPS){pipeFlow.PM_SUC=q;pipeFlow.SM_SUC=-q;pipeFlow.X_P=q}else{pipeFlow.SM_SUC=q;pipeFlow.PM_SUC=-q;pipeFlow.X_S=q}}}
  }

  const wetTarget:Record<string,number>=Object.fromEntries(pipeKeys.map(key=>[key,Math.abs(pipeFlow[key]||0)>1?1:0]))
  tankIds.forEach(id=>{if(isOpen(valves[`V-${id}-T`])&&tanks[id].volume>1)wetTarget[`${id}_BR`]=1});if(isOpen(valves['V-HSC']))wetTarget.HSC=1;if(isOpen(valves['V-LSC']))wetTarget.LSC=1
  for(const key of pipeKeys){const target=wetTarget[key]??0,cur=pipeFill[key]??0,rate=target>cur?PIPE_WET_RATE:PIPE_DRAIN_RATE;pipeFill[key]=Math.max(0,Math.min(1,cur+Math.sign(target-cur)*Math.min(Math.abs(target-cur),rate*k)))}

  const shipCondition=calculateShipCondition(tanks);if(shipCondition.heelDeg>3)alarms=addAlarm(alarms,'WARNING',`EXCESSIVE HEEL ${shipCondition.heelDeg.toFixed(1)}° ${shipCondition.heelSide}`);if(Math.abs(shipCondition.trimM)>1.5)alarms=addAlarm(alarms,'CAUTION',`LARGE TRIM ${Math.abs(shipCondition.trimM).toFixed(2)} m ${shipCondition.trimDirection}`);if(shipCondition.effectiveGM<1.2)alarms=addAlarm(alarms,'CAUTION',`FREE SURFACE EFFECT: EFFECTIVE GM ${shipCondition.effectiveGM.toFixed(2)} m`)
  const systemStatus:SystemStatus={mode,source,sink,totalFlow,portMainFlow:Math.abs(pipeFlow.PM_MAIN||0),stbdMainFlow:Math.abs(pipeFlow.SM_MAIN||0)}
  return {valves,pumps,tanks,pipeFill,pipeFlow,gravityFlow,shipCondition,systemStatus,alarms,events}
 })
}))
