import { useSimStore } from '../store/useSimStore'

export function SidePanel(){
 const s=useSimStore()
 const v=s.selectedValve?s.valves[s.selectedValve]:null
 const p=s.selectedPump?s.pumps[s.selectedPump]:null
 const c=s.shipCondition
 const sys=s.systemStatus
 const gravityEntries=Object.entries(s.gravityFlow).filter(([,q])=>Math.abs(q)>1)
 const ballastVolume=Object.values(s.tanks).reduce((sum,t)=>sum+t.volume,0)
 const ballastMass=ballastVolume*1.025
 const gmClass=c.stabilityStatus==='NORMAL'?'gm-normal':c.stabilityStatus==='CAUTION'?'gm-caution':'gm-danger'

 return <aside className="side compact-side">
  <div className="card compact-card condition-card">
   <div className="card-title-row"><h3>SHIP CONDITION</h3><span className={`status-pill ${c.stabilityStatus.toLowerCase()}`}>{c.stabilityStatus}</span></div>
   <div className="condition-grid condition-grid-expanded">
    <div className="condition-wide"><span>DISPLACEMENT</span><b>{c.displacement.toLocaleString(undefined,{maximumFractionDigits:0})} t</b></div>
    <div><span>HEEL</span><b>{c.heelDeg.toFixed(2)}° {c.heelSide==='UPRIGHT'?'':c.heelSide}</b></div>
    <div><span>TRIM</span><b>{Math.abs(c.trimM).toFixed(2)} m {c.trimDirection==='EVEN'?'':c.trimDirection}</b></div>
    <div><span>DRAFT F / A</span><b>{c.draftF.toFixed(2)} / {c.draftA.toFixed(2)} m</b></div>
    <div><span>MEAN DRAFT</span><b>{c.meanDraft.toFixed(2)} m</b></div>
    <div><span>EFFECTIVE GM</span><b>{c.effectiveGM.toFixed(2)} m</b></div>
    <div><span>F.S. CORR.</span><b>-{c.freeSurfaceCorrection.toFixed(2)} m</b></div>
    <div><span>BALLAST WATER</span><b>{ballastVolume.toFixed(0)} m³</b></div>
    <div><span>BALLAST MASS</span><b>{ballastMass.toFixed(0)} t</b></div>
   </div>
  </div>

  <div className="card compact-card route-card">
   <div className="card-title-row"><h3>ACTIVE ROUTE</h3><b className="flow-big">{sys.totalFlow.toFixed(0)} m³/h</b></div>
   <div className="route-mode compact-route-mode">{sys.mode}</div>
   <div className="mini-route"><span>{sys.source}</span><b>→</b><span>{sys.sink}</span></div>
   <div className="mini-bars"><span>PORT <b>{sys.portMainFlow.toFixed(0)}</b></span><span>STBD <b>{sys.stbdMainFlow.toFixed(0)}</b></span></div>
  </div>

  <div className={`card compact-card stability-card ${gmClass}`}>
   <div className="card-title-row"><h3>STABILITY</h3><b>{c.effectiveGM.toFixed(2)} m GM</b></div>
   <div className="gm-bar"><i style={{width:`${Math.max(0,Math.min(100,c.effectiveGM/c.baseGM*100))}%`}}/></div>
   <div className="mini-bars"><span>FSC <b>-{c.freeSurfaceCorrection.toFixed(2)} m</b></span><span>SLACK <b>{c.slackTankCount}</b></span></div>
  </div>

  {v&&<div className="card compact-card control-card">
   <div className="card-title-row"><h3>VALVE</h3><b>{v.id}</b></div>
   <div className="control-name">{v.name}</div>
   <div className="control-value">{v.opening.toFixed(0)}%</div>
   {v.kind==='control'?<>
    <input type="range" min="0" max="100" value={v.target} onChange={e=>s.setValveTarget(v.id,+e.target.value)}/>
    <div className="row tight"><button onClick={()=>s.setValveTarget(v.id,0)}>0%</button><button onClick={()=>s.setValveTarget(v.id,Math.max(0,v.target-10))}>-10</button><button onClick={()=>s.setValveTarget(v.id,Math.min(100,v.target+10))}>+10</button><button onClick={()=>s.setValveTarget(v.id,100)}>100%</button></div>
   </>:<button onClick={()=>s.toggleValve(v.id)}>{v.target>50?'CLOSE':'OPEN'}</button>}
  </div>}

  {p&&<div className="card compact-card control-card">
   <div className="card-title-row"><h3>PUMP</h3><b>{p.name}</b></div>
   <div className="pump-compact"><span>{p.trip?'TRIP':p.running?'RUN':'STOP'}</span><b>{p.flow.toFixed(0)} m³/h</b></div>
   <div className="mini-bars"><span>SUC <b>{p.suctionPressure.toFixed(2)} MPa</b></span><span>DIS <b>{p.dischargePressure.toFixed(2)} MPa</b></span></div>
   <div className="mini-bars"><span>CUR <b>{p.current.toFixed(0)}%</b></span><span>TEMP <b>{p.temperature.toFixed(0)}°C</b></span></div>
   {p.vfd&&<><input type="range" min="30" max="100" value={p.speedTarget} onChange={e=>s.setPumpSpeed(p.id,+e.target.value)}/><div className="mini-bars"><span>VFD</span><b>{p.speedTarget.toFixed(0)}%</b></div></>}
   <button onClick={()=>s.togglePump(p.id)}>{p.running?'STOP':'START'}</button>
  </div>}

  <details className="card compact-card collapsible-card">
   <summary>GRAVITY / HYDROSTATIC</summary>
   {gravityEntries.length?<div className="gravity-list">{gravityEntries.map(([id,q])=>{
    const t=s.tanks[id]; const f=t.volume/t.capacity; const level=t.tankHeight*f
    const localDraft=c.meanDraft+c.trimM*(t.lcg/180)+(c.heelSide==='STBD'?1:c.heelSide==='PORT'?-1:0)*Math.tan(c.heelDeg*Math.PI/180)*t.tcg
    const head=localDraft-(t.bottomElevation+level)
    return <div className="gravity-row" key={id}><span><b>{id}</b> {q>0?'SEA→TANK':'TANK→SEA'}</span><span>{Math.abs(q).toFixed(0)} m³/h · Δh {Math.abs(head).toFixed(2)}m</span></div>
   })}</div>:<small>No active gravity flow.</small>}
  </details>

  <details className="card compact-card collapsible-card">
   <summary>QUICK GUIDE</summary>
   <small>
    BALLAST: HSC/LSC → pump suction valve → pump → pump discharge valve → P/S DIS → tank.<br/><br/>
    DEBALLAST: tank → P/S SUC → pump → O/B.<br/><br/>
    P↔S TRANSFER: source SUC → pump → opposite DIS.<br/><br/>
    Gravity flow is calculated from an actually open hydraulic route and hydrostatic head.
   </small>
  </details>
 </aside>
}
