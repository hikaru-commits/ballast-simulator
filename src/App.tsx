import { useEffect, useRef, useState } from 'react'
import { useSimStore } from './store/useSimStore'
import { PidDiagram } from './components/PidDiagram'
import { SidePanel } from './components/SidePanel'
import { BottomPanel } from './components/BottomPanel'
import { ShipAttitude } from './components/ShipAttitude'

export default function App(){
 const tick=useSimStore(s=>s.tick)
 const s=useSimStore()
 const last=useRef(performance.now())
 const [sideHidden,setSideHidden]=useState(false)
 const [attitudeHidden,setAttitudeHidden]=useState(false)

 useEffect(()=>{
  let raf=0
  const loop=(t:number)=>{
   const dt=Math.min(.05,(t-last.current)/1000)
   last.current=t
   tick(dt)
   raf=requestAnimationFrame(loop)
  }
  raf=requestAnimationFrame(loop)
  return()=>cancelAnimationFrame(raf)
 },[tick])

 return <div className="app compact-app">
  <header className="compact-header">
   <div className="brand"><b>BALLAST OPERATION SIMULATOR</b><span>Training Vessel</span></div>
   <div className="toolbar">
    <button className={s.training?'active':''} onClick={()=>s.setTraining(!s.training)}>{s.training?'TRAINING':'OPERATION'}</button>
    {[1,2,5].map(x=><button key={x} className={s.speed===x?'active':''} onClick={()=>s.setSpeed(x)}>×{x}</button>)}
    <button className={s.paused?'danger':''} onClick={()=>s.setPaused(!s.paused)}>{s.paused?'RESUME':'PAUSE'}</button>
    <button onClick={()=>setAttitudeHidden(v=>!v)}>{attitudeHidden?'SHOW ATTITUDE':'HIDE ATTITUDE'}</button>
    <button onClick={()=>setSideHidden(v=>!v)}>{sideHidden?'SHOW PANEL':'HIDE PANEL'}</button>
    <button onClick={s.reset}>RESET</button>
   </div>
  </header>

  <div className={`sim-shell ${sideHidden?'side-hidden':''} ${attitudeHidden?'attitude-hidden':''}`}>
   <section className="sim-primary">
    <div className="pid-wrap compact-pid-wrap"><PidDiagram/></div>
    {!attitudeHidden&&<div className="attitude-slot"><ShipAttitude/></div>}
    {!attitudeHidden&&<div className="embedded-log-slot"><BottomPanel/></div>}
   </section>
   {!sideHidden&&<SidePanel/>}
  </div>

 </div>
}
