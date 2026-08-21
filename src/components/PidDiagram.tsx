import { Valve } from './Valve'
import { Tank } from './Tank'
import { Pump } from './Pump'
import { useSimStore } from '../store/useSimStore'

// Training UI: tank numbers run top-to-bottom (No.1 → No.4) for fast visual recognition.
const portTanks=[{id:'P1',y:75},{id:'P2',y:170},{id:'P3',y:265},{id:'P4',y:360}] as const
const stbdTanks=[{id:'S1',y:75},{id:'S2',y:170},{id:'S3',y:265},{id:'S4',y:360}] as const
const pumps=[{id:'BP1',x:585},{id:'BP2',x:755},{id:'BP3',x:925}] as const

export function PidDiagram(){
 const fill=useSimStore(s=>s.pipeFill),flow=useSimStore(s=>s.pipeFlow),training=useSimStore(s=>s.training)
 const waterPath=(id:string,d:string,reverse=false,klass='')=>{const f=Math.max(0,Math.min(1,fill[id]??0)),raw=flow[id]??0,q=Math.abs(raw),flowReverse=raw<0?!reverse:reverse;return <g className={klass}><path d={d} className="pipe-base"/>{training&&f>.003&&<path d={d} pathLength={100} className="pipe-water-fill" style={{strokeDasharray:`${f*100} 100`}}/>}{training&&q>1&&<path d={d} className={`pipe-flow ${flowReverse?'reverse':''}`} style={{animationDuration:`${Math.max(.7,2.4-q/700)}s`}}/>}</g>}
 const branch=(id:string,y:number,side:'P'|'S')=>{const tankX=side==='P'?20:1360,tankEdge=side==='P'?155:1360,mainX=side==='P'?245:1260,valveX=side==='P'?185:1330;return <g key={id}><Tank id={id} x={tankX} y={y-36} w={135} h={72}/>{waterPath(`${id}_BR`,`M${tankEdge} ${y} H${mainX}`,side==='S',side==='P'?'port-route':'stbd-route')}<Valve id={`V-${id}-T`} x={valveX} y={y} showLabel={false}/><rect x={valveX-34} y={y+17} width="68" height="18" rx="3" className="branch-label-bg"/><text x={valveX} y={y+30} textAnchor="middle" className="branch-label-text">V-{id}-T</text></g>}
 const stripTap=(id:string,y:number,side:'P'|'S')=>{
  // Dedicated stripping take-off: independent from the normal tank valve/ballast-main branch.
  // Each tank has its own STR valve, then joins the side stripping riser.
  const tankEdge=side==='P'?155:1360
  const riser=side==='P'?285:1225
  const valveX=side==='P'?225:1290
  const stripY=y+22
  const d=side==='P'?`M${tankEdge} ${stripY} H${riser}`:`M${tankEdge} ${stripY} H${riser}`
  return <g key={`${id}-strip`}>
    {waterPath(`${id}_STR`,d,side==='S','stripping-route')}
    <Valve id={`V-${id}-STR`} x={valveX} y={stripY} showLabel={false}/>
    <rect x={valveX-32} y={stripY+10} width="64" height="16" rx="3" className="branch-label-bg"/>
    <text x={valveX} y={stripY+22} textAnchor="middle" className="branch-label-text">V-{id}-STR</text>
  </g>
 }
 return <svg viewBox="0 0 1510 760" className="pid" onClick={()=>useSimStore.getState().setSelectedValve(null)}>
  <text x="640" y="35" className="section-title">PUMP ROOM</text>
  <text x="30" y="35" className="port-main-label">PORT SIDE TANKS · No.1 → No.4</text><text x="1320" y="35" className="stbd-main-label">STBD SIDE TANKS · No.1 → No.4</text>
  <rect x="5" y="45" width="265" height="500" rx="8" className="functional-zone"/><rect x="1240" y="45" width="265" height="500" rx="8" className="functional-zone"/>
  {portTanks.map(t=>branch(t.id,t.y,'P'))}{stbdTanks.map(t=>branch(t.id,t.y,'S'))}

  {waterPath('PM_MAIN','M245 75 V485',false,'port-route')}{waterPath('SM_MAIN','M1260 75 V485',false,'stbd-route')}
  <text x="30" y="515" className="port-main-label">PORT BALLAST MAIN</text><text x="1320" y="515" className="stbd-main-label">STBD BALLAST MAIN</text>

  {waterPath('PM_SUC','M245 165 H470',false,'port-route')}<Valve id="V-P-SUC" x={390} y={165} labelY={-22} labelWidth={82}/>
  {waterPath('SM_SUC','M1260 165 H1040',true,'stbd-route')}<Valve id="V-S-SUC" x={1120} y={165} labelY={-22} labelWidth={82}/>
  {waterPath('SUCTION_HEADER','M470 165 H1040')}<text x="755" y="155" textAnchor="middle" className="header-label">COMMON SUCTION HEADER</text>

  <rect x="520" y="55" width="145" height="48" className="equipment-box"/><text x="592" y="76" textAnchor="middle" className="svg-label">HIGH SEA CHEST</text><text x="592" y="92" textAnchor="middle" className="svg-small">≈≈≈</text>
  {waterPath('HSC','M592 103 V165')}<Valve id="V-HSC" x={592} y={125} rotate={90} labelY={-27} labelWidth={74}/>
  <rect x="845" y="55" width="145" height="48" className="equipment-box"/><text x="917" y="76" textAnchor="middle" className="svg-label">LOW SEA CHEST</text><text x="917" y="92" textAnchor="middle" className="svg-small">≈≈≈</text>
  {waterPath('LSC','M917 103 V165')}<Valve id="V-LSC" x={917} y={125} rotate={90} labelY={-27} labelWidth={74}/>

  {pumps.map(({id,x})=><g key={id}>{waterPath(`${id}_IN`,`M${x} 165 V285`)}<Valve id={`V-${id}-S`} x={x} y={205} rotate={90} labelY={-28} labelWidth={82}/><Pump id={id} x={x} y={285}/>{waterPath(`${id}_OUT`,`M${x} 313 V485`)}<Valve id={`V-${id}-D`} x={x} y={420} rotate={90} labelY={-28} labelWidth={82}/><text x={x+20} y="365" className="svg-small">NRV{id.slice(-1)}</text><path d={`M${x-9} 360 L${x+9} 360 L${x} 374 Z`} className="nrv-symbol"/></g>)}

  {waterPath('DISCHARGE_HEADER','M470 485 H1040')}<text x="755" y="475" textAnchor="middle" className="header-label">COMMON DISCHARGE HEADER</text>
  {waterPath('PM_DIS','M470 485 H245',true,'port-route')}<Valve id="V-P-DIS" x={390} y={485} labelY={-22} labelWidth={82}/>
  {waterPath('SM_DIS','M1040 485 H1260',false,'stbd-route')}<Valve id="V-S-DIS" x={1120} y={485} labelY={-22} labelWidth={82}/>
  {waterPath('X_P','M320 165 V485',false,'crossover-route')}<Valve id="V-X-P" x={320} y={325} rotate={90} labelY={-28} labelWidth={72}/><text x="334" y="350" className="cross-label">PORT BYPASS</text>
  {waterPath('X_S','M1190 165 V485',false,'crossover-route')}<Valve id="V-X-S" x={1190} y={325} rotate={90} labelY={-28} labelWidth={72}/><text x="1176" y="350" textAnchor="end" className="cross-label">STBD BYPASS</text>
  {waterPath('OB','M755 485 V548')}<Valve id="V-OB" x={755} y={518} rotate={90} labelY={-28} labelWidth={70}/><rect x="690" y="548" width="130" height="34" className="overboard-box"/><text x="755" y="570" textAnchor="middle" className="overboard-label">OVERBOARD</text>

  {/* Dedicated stripping system. Tank stripping branches feed a separate stripping main. */}
  {portTanks.map(t=>stripTap(t.id,t.y,'P'))}{stbdTanks.map(t=>stripTap(t.id,t.y,'S'))}
  {waterPath('STRIPPING_MAIN','M285 97 V610 H1225 V97',false,'stripping-route')}
  <text x="755" y="602" textAnchor="middle" className="stripping-header-label">COMMON STRIPPING MAIN · FROM P/S TANK STRIPPING BRANCHES</text>

  {/* Dedicated GS pump supplies eductor motive water directly from sea. */}
  <rect x="545" y="625" width="115" height="40" className="equipment-box"/><text x="602" y="645" textAnchor="middle" className="svg-label">GS SEA CHEST</text><text x="602" y="658" textAnchor="middle" className="svg-small">≈≈≈</text>
  {waterPath('GS_SEA','M660 645 H700')}<Valve id="V-GS-S" x={685} y={645} showLabel={false}/><text x="685" y="628" textAnchor="middle" className="svg-small">V-GS-S</text>
  {waterPath('GS_IN','M700 645 H735')}<Pump id="GS1" x={765} y={645}/>{waterPath('GS_OUT','M795 645 H900')}<Valve id="V-GS-D" x={840} y={645} showLabel={false}/><text x="840" y="628" textAnchor="middle" className="svg-small">V-GS-D</text>
  {waterPath('EDUCTOR_MOTIVE','M900 645 H1010')}<Valve id="V-WER1" x={945} y={645} showLabel={false}/><text x="945" y="628" textAnchor="middle" className="svg-small">V-WER1</text>
  {/* Eductor: motive water enters from left, stripping suction enters the throat from above, mixed flow discharges right. */}
  <g className="eductor-body">
   <path d="M1005 628 L1032 640 L1042 640 L1070 628 L1070 662 L1042 650 L1032 650 L1005 662 Z" className="eductor-symbol"/>
   <line x1="1037" y1="610" x2="1037" y2="640" className="eductor-suction-neck"/>
  </g>
  <text x="1038" y="684" textAnchor="middle" className="svg-label">EDUCTOR 1</text>
  <text x="984" y="635" textAnchor="end" className="motive-label">MOTIVE</text>
  <text x="1048" y="604" className="strip-label">STRIPPING SUCTION</text>
  {waterPath('EDUCTOR_SUCTION','M755 610 H1037',false,'stripping-route')}<Valve id="V-WES1" x={930} y={610} showLabel={false}/><text x="930" y="594" textAnchor="middle" className="svg-small">V-WES1</text>
  {waterPath('EDUCTOR_OUT','M1070 645 H1190')}<text x="1120" y="635" className="svg-small">TO OVERBOARD</text>

  {[ [245,165],[245,485],[1260,165],[1260,485],[470,165],[1040,165],[470,485],[1040,485],[592,165],[917,165],[585,165],[755,165],[925,165],[585,485],[755,485],[925,485],[320,165],[320,485],[1190,165],[1190,485],[285,610],[1225,610],[755,610],[1037,610] ].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" className="junction-dot"/>)}

  <g transform="translate(30 700)"><rect width="1450" height="42" rx="7" className="legend-box"/><text x="16" y="18" className="svg-label">TRAINING LOGIC</text><text x="150" y="18" className="svg-small">NORMAL: SEA/TANK → BALLAST PUMP → destination</text><text x="530" y="18" className="svg-small">STRIPPING: SEA → GS PUMP → V-WER1 → EDUCTOR → O/B</text><text x="950" y="18" className="svg-small">Tank → STR valve → STRIPPING MAIN → V-WES1 → EDUCTOR</text></g>
 </svg>
}
