import { useSimStore } from '../store/useSimStore'
export function Pump({id,x,y}:{id:'BP1'|'BP2'|'BP3'|'GS1';x:number;y:number}){
 const p=useSimStore(s=>s.pumps[id]); const sel=useSimStore(s=>s.setSelectedPump)
 const pct=p.ratedRpm?Math.round(p.rpm/p.ratedRpm*100):0
 return <g transform={`translate(${x} ${y})`} onClick={(e)=>{e.stopPropagation();sel(id)}} className="pump-symbol">
  <circle r="28" className={p.trip?'pump trip':p.running?'pump run':'pump'}/><path d="M-12 12 L16 0 L-12 -12 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
  <text x="42" y="-7" className="svg-label">{id}{p.vfd?' (VFD)':''}</text><text x="42" y="10" className="svg-small">{p.trip?'TRIP':p.running?'RUNNING':'STOPPED'} · {pct}%</text><text x="42" y="27" className="svg-small">{p.flow.toFixed(0)} m³/h</text>
 </g>
}
