import { useSimStore } from '../store/useSimStore'

export function Valve({
  id,
  x,
  y,
  rotate=0,
  showLabel=true,
  labelX=0,
  labelY=-18,
  labelWidth=72,
}:{
  id:string
  x:number
  y:number
  rotate?:number
  showLabel?:boolean
  labelX?:number
  labelY?:number
  labelWidth?:number
}){
 const v=useSimStore(s=>s.valves[id]); const select=useSimStore(s=>s.setSelectedValve); const toggle=useSimStore(s=>s.toggleValve)
 if(!v) return null
 const color=v.state==='open'?'#35d07f':v.state==='closed'?'#7a8797':'#f4c95d'
 return <g transform={`translate(${x} ${y}) rotate(${rotate})`} className="valve" onClick={(e)=>{e.stopPropagation();select(id); if(v.kind==='isolation')toggle(id)}}>
   <polygon points="-10,-8 0,0 -10,8" fill="none" stroke={color} strokeWidth="2.4"/><polygon points="10,-8 0,0 10,8" fill="none" stroke={color} strokeWidth="2.4"/>
   <circle cx="0" cy="0" r="3.5" fill={color}/>
   {showLabel&&<g transform={`translate(${labelX} ${labelY})`}><rect x={-labelWidth/2} y="-11" width={labelWidth} height="16" rx="3" className="valve-label-bg"/><text x="0" y="1" textAnchor="middle" className="valve-label-text">{id}</text></g>}
   {v.kind==='control'&&<text x="0" y="20" textAnchor="middle" className="svg-small">{v.opening.toFixed(0)}%</text>}
 </g>
}
