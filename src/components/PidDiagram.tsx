import { Valve } from './Valve'
import { Tank } from './Tank'
import { Pump } from './Pump'
import { useSimStore } from '../store/useSimStore'

const portTanks=[{id:'P4',y:75},{id:'P3',y:170},{id:'P2',y:265},{id:'P1',y:360}] as const
const stbdTanks=[{id:'S4',y:75},{id:'S3',y:170},{id:'S2',y:265},{id:'S1',y:360}] as const
const pumps=[{id:'BP1',x:585},{id:'BP2',x:755},{id:'BP3',x:925}] as const

export function PidDiagram(){
 const fill=useSimStore(s=>s.pipeFill),flow=useSimStore(s=>s.pipeFlow),training=useSimStore(s=>s.training)
 const waterPath=(id:string,d:string,reverse=false,klass='')=>{const f=Math.max(0,Math.min(1,fill[id]??0)),raw=flow[id]??0,q=Math.abs(raw),flowReverse=raw<0?!reverse:reverse;return <g className={klass}><path d={d} className="pipe-base"/>{training&&f>.003&&<path d={d} pathLength={100} className="pipe-water-fill" style={{strokeDasharray:`${f*100} 100`}}/>}{training&&q>1&&<path d={d} className={`pipe-flow ${flowReverse?'reverse':''}`} style={{animationDuration:`${Math.max(.7,2.4-q/700)}s`}}/>}</g>}
 const branch=(id:string,y:number,side:'P'|'S')=>{const tankX=side==='P'?20:1360, tankEdge=side==='P'?155:1360, mainX=side==='P'?245:1260, valveX=side==='P'?185:1330;return <g key={id}><Tank id={id} x={tankX} y={y-36} w={135} h={72}/>{waterPath(`${id}_BR`,`M${tankEdge} ${y} H${mainX}`,side==='S',side==='P'?'port-route':'stbd-route')}<Valve id={`V-${id}-T`} x={valveX} y={y} showLabel={false}/><rect x={valveX-34} y={y+17} width="68" height="18" rx="3" className="branch-label-bg"/><text x={valveX} y={y+30} textAnchor="middle" className="branch-label-text">V-{id}-T</text></g>}
 return <svg viewBox="0 0 1510 760" className="pid" onClick={()=>useSimStore.getState().setSelectedValve(null)}>
  <text x="640" y="35" className="section-title">PUMP ROOM</text>
  <text x="30" y="35" className="port-main-label">PORT SIDE TANKS</text><text x="1350" y="35" className="stbd-main-label">STBD SIDE TANKS</text>
  <rect x="5" y="45" width="265" height="500" rx="8" className="functional-zone"/><rect x="1240" y="45" width="265" height="500" rx="8" className="functional-zone"/>
  {portTanks.map(t=>branch(t.id,t.y,'P'))}{stbdTanks.map(t=>branch(t.id,t.y,'S'))}

  {/* Side ballast mains. Junction dots only where branches truly connect. */}
  {waterPath('PM_MAIN','M245 75 V485',false,'port-route')}{waterPath('SM_MAIN','M1260 75 V485',false,'stbd-route')}
  <text x="30" y="515" className="port-main-label">PORT BALLAST MAIN</text><text x="1320" y="515" className="stbd-main-label">STBD BALLAST MAIN</text>

  {/* Common suction header and side suction isolations */}
  {waterPath('PM_SUC','M245 165 H470',false,'port-route')}<Valve id="V-P-SUC" x={390} y={165} labelY={-22} labelWidth={82}/>
  {waterPath('SM_SUC','M1260 165 H1040',true,'stbd-route')}<Valve id="V-S-SUC" x={1120} y={165} labelY={-22} labelWidth={82}/>
  {waterPath('SUCTION_HEADER','M470 165 H1040')}<text x="755" y="155" textAnchor="middle" className="header-label">COMMON SUCTION HEADER</text>

  {/* High / Low sea chests connect directly to common suction; no sea header. */}
  <rect x="520" y="55" width="145" height="48" className="equipment-box"/><text x="592" y="76" textAnchor="middle" className="svg-label">HIGH SEA CHEST</text><text x="592" y="92" textAnchor="middle" className="svg-small">≈≈≈</text>
  {waterPath('HSC','M592 103 V165')}<Valve id="V-HSC" x={592} y={125} rotate={90} labelY={-27} labelWidth={74}/>
  <rect x="845" y="55" width="145" height="48" className="equipment-box"/><text x="917" y="76" textAnchor="middle" className="svg-label">LOW SEA CHEST</text><text x="917" y="92" textAnchor="middle" className="svg-small">≈≈≈</text>
  {waterPath('LSC','M917 103 V165')}<Valve id="V-LSC" x={917} y={125} rotate={90} labelY={-27} labelWidth={74}/>

  {/* Three parallel pumps. Each has its own suction and discharge isolation valve. */}
  {pumps.map(({id,x})=><g key={id}>
   {waterPath(`${id}_IN`,`M${x} 165 V285`)}<Valve id={`V-${id}-S`} x={x} y={205} rotate={90} labelY={-28} labelWidth={82}/><Pump id={id} x={x} y={285}/>
   {waterPath(`${id}_OUT`,`M${x} 313 V485`)}<Valve id={`V-${id}-D`} x={x} y={420} rotate={90} labelY={-28} labelWidth={82}/><text x={x+20} y="365" className="svg-small">NRV{id.slice(-1)}</text><path d={`M${x-9} 360 L${x+9} 360 L${x} 374 Z`} className="nrv-symbol"/>
  </g>)}

  {/* Common discharge header and side discharge isolations */}
  {waterPath('DISCHARGE_HEADER','M470 485 H1040')}<text x="755" y="475" textAnchor="middle" className="header-label">COMMON DISCHARGE HEADER</text>
  {waterPath('PM_DIS','M470 485 H245',true,'port-route')}<Valve id="V-P-DIS" x={390} y={485} labelY={-22} labelWidth={82}/>
  {waterPath('SM_DIS','M1040 485 H1260',false,'stbd-route')}<Valve id="V-S-DIS" x={1120} y={485} labelY={-22} labelWidth={82}/>

  {/* One straight vertical crossover/bypass on each side, with one isolation valve per side. */}
  {waterPath('X_P','M320 165 V485',false,'crossover-route')}<Valve id="V-X-P" x={320} y={325} rotate={90} labelY={-28} labelWidth={72}/><text x="334" y="350" className="cross-label">PORT BYPASS</text>
  {waterPath('X_S','M1190 165 V485',false,'crossover-route')}<Valve id="V-X-S" x={1190} y={325} rotate={90} labelY={-28} labelWidth={72}/><text x="1176" y="350" textAnchor="end" className="cross-label">STBD BYPASS</text>

  {/* Overboard is an independent branch from the discharge header. */}
  {waterPath('OB','M755 485 V555')}<Valve id="V-OB" x={755} y={520} rotate={90} labelY={-28} labelWidth={70}/><rect x="680" y="555" width="150" height="42" className="overboard-box"/><text x="755" y="580" textAnchor="middle" className="overboard-label">OVERBOARD</text>

  {/* Explicit connection dots: every dot means hydraulically connected. No dot is drawn at visual-only crossings. */}
  {[ [245,165],[245,485],[1260,165],[1260,485],[470,165],[1040,165],[470,485],[1040,485],[592,165],[917,165],[585,165],[755,165],[925,165],[585,485],[755,485],[925,485],[320,165],[320,485],[1190,165],[1190,485] ].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" className="junction-dot"/>)}

  <g transform="translate(290 620)"><rect width="930" height="105" rx="8" className="legend-box"/><text x="18" y="24" className="svg-label">LINE-UP LOGIC</text><text x="18" y="47" className="svg-small">BALLAST: HSC/LSC → COMMON SUCTION → selected pump → COMMON DISCHARGE → P/S DIS → tank</text><text x="18" y="68" className="svg-small">DEBALLAST: tank → P/S SUC → COMMON SUCTION → selected pump → COMMON DISCHARGE → O/B</text><text x="18" y="89" className="svg-small">P↔S TRANSFER: source-side SUC → pump → opposite-side DIS. BP1 is VFD 30–100%; BP2/BP3 fixed speed.</text></g>
 </svg>
}
