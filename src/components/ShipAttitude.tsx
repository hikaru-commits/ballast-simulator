import { useMemo } from 'react'
import { useSimStore } from '../store/useSimStore'

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v))

export function ShipAttitude(){
 const c=useSimStore(s=>s.shipCondition)
 const tanks=useSimStore(s=>s.tanks)
 const portIds=['P1','P2','P3','P4'] as const
 const stbdIds=['S1','S2','S3','S4'] as const
 const avg=(ids:readonly string[])=>ids.reduce((a,id)=>a+tanks[id].volume/tanks[id].capacity,0)/ids.length
 const pFill=avg(portIds), sFill=avg(stbdIds)
 const heelSigned=c.heelSide==='STBD'?c.heelDeg:c.heelSide==='PORT'?-c.heelDeg:0
 // Heel is shown at true angular scale. Trim is physically tiny on a long vessel, so only the side-view rotation is magnified.
 const LBP=180
 const trimAngleActual=Math.atan2(c.draftF-c.draftA,LBP)*180/Math.PI
 const trimVisualGain=8
 const trimVisual=clamp(trimAngleActual*trimVisualGain,-5,5)
 const draftMin=6.5,draftMax=10.5
 const draftToY=(d:number)=>145-(clamp(d,draftMin,draftMax)-draftMin)/(draftMax-draftMin)*72
 const fY=draftToY(c.draftF),aY=draftToY(c.draftA)
 const waterY=(fY+aY)/2
 const portPct=Math.round(pFill*100),stbdPct=Math.round(sFill*100)
 const heelText=c.heelSide==='UPRIGHT'?'UPRIGHT':`${c.heelDeg.toFixed(2)}° ${c.heelSide}`
 const trimText=c.trimDirection==='EVEN'?'EVEN':`${Math.abs(c.trimM).toFixed(2)} m ${c.trimDirection}`

 const sectionClipIds=useMemo(()=>({p:`port-${crypto.randomUUID()}`,s:`stbd-${crypto.randomUUID()}`}),[])
 return <div className="attitude-card">
  <div className="attitude-head"><div><b>SHIP ATTITUDE</b><span>Tank mass → draft / trim / heel</span></div><div className="attitude-values"><span>HEEL <b>{heelText}</b></span><span>TRIM <b>{trimText}</b></span></div></div>
  <div className="attitude-grid">
   <div className="attitude-view">
    <div className="attitude-label">TRANSVERSE SECTION</div>
    <svg viewBox="0 0 300 190" role="img" aria-label="Transverse heel view">
     <defs>
      <clipPath id={sectionClipIds.p}><path d="M72 60 L145 53 L145 141 L87 135 Q70 111 72 60Z" transform={`rotate(${heelSigned} 150 104)`}/></clipPath>
      <clipPath id={sectionClipIds.s}><path d="M155 53 L228 60 Q230 111 213 135 L155 141Z" transform={`rotate(${heelSigned} 150 104)`}/></clipPath>
     </defs>
     <line x1="18" y1="108" x2="282" y2="108" className="attitude-sea"/>
     <text x="20" y="102" className="attitude-note">SEA LEVEL</text>
     <g transform={`rotate(${heelSigned} 150 104)`}>
      <path d="M62 50 Q150 31 238 50 L228 114 Q218 145 150 154 Q82 145 72 114Z" className="attitude-hull"/>
      <line x1="150" y1="47" x2="150" y2="148" className="attitude-center"/>
      <path d="M72 60 L145 53 L145 141 L87 135 Q70 111 72 60Z" className="attitude-tank"/>
      <path d="M155 53 L228 60 Q230 111 213 135 L155 141Z" className="attitude-tank"/>
      <text x="107" y="75" textAnchor="middle" className="attitude-tank-label">PORT</text>
      <text x="192" y="75" textAnchor="middle" className="attitude-tank-label">STBD</text>
     </g>
     <rect x="55" y={145-82*pFill} width="95" height={82*pFill+25} className="attitude-liquid" clipPath={`url(#${sectionClipIds.p})`}/>
     <rect x="150" y={145-82*sFill} width="95" height={82*sFill+25} className="attitude-liquid" clipPath={`url(#${sectionClipIds.s})`}/>
     <line x1="150" y1="25" x2="150" y2="165" className="attitude-vertical"/>
     <path d="M150 28 A48 48 0 0 1 190 41" className="attitude-angle"/>
     <text x="235" y="172" textAnchor="end" className="attitude-note">P {portPct}%</text>
     <text x="282" y="172" textAnchor="end" className="attitude-note">S {stbdPct}%</text>
    </svg>
   </div>
   <div className="attitude-view">
    <div className="attitude-label">SIDE PROFILE</div>
    <svg viewBox="0 0 520 190" role="img" aria-label="Longitudinal trim and draft view">
     <line x1="20" y1={waterY} x2="500" y2={waterY} className="attitude-sea"/>
     <text x="24" y={waterY-6} className="attitude-note">WATERLINE</text>
     <g transform={`rotate(${trimVisual} 260 103)`}>
      <path d="M48 70 H394 Q444 72 482 93 Q452 127 390 139 H78 Q49 132 39 111 L47 83Z" className="attitude-hull"/>
      <line x1="84" y1="91" x2="438" y2="91" className="attitude-deck"/>
      <rect x="132" y="61" width="45" height="30" className="attitude-super"/>
      <line x1="155" y1="61" x2="155" y2="43" className="attitude-mast"/>
      <text x="55" y="155" className="attitude-note">AFT</text><text x="457" y="155" className="attitude-note">FORE</text>
     </g>
     <line x1="58" y1={aY} x2="58" y2="155" className="draft-gauge"/>
     <line x1="465" y1={fY} x2="465" y2="155" className="draft-gauge"/>
     <text x="58" y="174" textAnchor="middle" className="draft-text">A {c.draftA.toFixed(2)} m</text>
     <text x="465" y="174" textAnchor="middle" className="draft-text">F {c.draftF.toFixed(2)} m</text>
     <text x="260" y="174" textAnchor="middle" className="attitude-note">Mean {c.meanDraft.toFixed(2)} m</text>
    </svg>
    <div className="attitude-foot">Trim graphic uses ×{trimVisualGain} visual gain because the true hull angle is only {Math.abs(trimAngleActual).toFixed(3)}°.</div>
   </div>
  </div>
 </div>
}
