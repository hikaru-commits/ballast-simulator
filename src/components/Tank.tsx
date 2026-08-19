import { useSimStore } from '../store/useSimStore'
export function Tank({id,x,y,w=90,h=70}:{id:string;x:number;y:number;w?:number;h?:number}){
 const t=useSimStore(s=>s.tanks[id]); const f=t.volume/t.capacity; const slack=f>.02&&f<.98; const level=t.tankHeight*f; const surface=t.bottomElevation+level
 return <g transform={`translate(${x} ${y})`}>
 <rect width={w} height={h} rx="4" className={`tank-shell ${slack?'tank-slack':''}`}/><rect x="2" y={h-(h-4)*f-2} width={w-4} height={(h-4)*f} className="tank-water"/><text x={w/2} y="18" textAnchor="middle" className="svg-label">{t.name}</text>
 {slack&&<g><rect x={w-50} y="5" width="44" height="17" rx="3" className="slack-badge"/><text x={w-28} y="17" textAnchor="middle" className="slack-text">SLACK</text></g>}
 <text x={w/2} y={h-22} textAnchor="middle" className="svg-small">{(f*100).toFixed(0)}% · {t.volume.toFixed(0)} m³</text><text x={w/2} y={h-8} textAnchor="middle" className="tank-level-text">LEVEL {level.toFixed(2)} m · EL {surface.toFixed(2)} m</text></g>
}
