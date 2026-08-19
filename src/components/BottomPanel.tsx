import { useSimStore } from '../store/useSimStore'

export function BottomPanel(){
  // IMPORTANT: keep the Zustand selector referentially stable.
  // Filtering inside the selector creates a new array on every snapshot and can
  // trigger an infinite render loop / blank screen with Zustand v5.
  const allAlarms = useSimStore(s=>s.alarms)
  const events = useSimStore(s=>s.events)
  const ack = useSimStore(s=>s.ackAlarm)
  const alarms = allAlarms.filter(a=>a.active)

  return <div className="bottom">
    <div className="log">
      <h3>ALARMS</h3>
      {alarms.length===0
        ? <div className="muted">No active alarms</div>
        : alarms.map(a=><div key={a.id} className={`alarm ${a.severity.toLowerCase()} ${a.ack?'ack':''}`} onClick={()=>ack(a.id)}><b>{a.severity}</b> {a.time} {a.message} {a.ack&&'· ACK'}</div>)}
    </div>
    <div className="log">
      <h3>EVENT LOG</h3>
      {events.map(e=><div key={e.id}>{e.time} {e.message}</div>)}
    </div>
  </div>
}
