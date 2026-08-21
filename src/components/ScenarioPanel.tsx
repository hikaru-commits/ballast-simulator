import { useEffect, useMemo, useState } from 'react'
import { useSimStore } from '../store/useSimStore'

const levelInfo = [
 {level:1,title:'SINGLE TANK CONTROL',desc:'No.2 WBT(P)を指定液面まで調整',hint:'No.2 PORTだけを対象にラインアップし、LEVEL 5.0 m ±0.10 mで停止してください。',target:'P2 = 5.0 ±0.10 m'},
 {level:2,title:'MULTI TANK CONTROL',desc:'複数タンクを指定液面へ調整',hint:'P/Sを同時に考えます。P2/S2を6.0m、P3/S3を4.0mへ。左右差を作り過ぎないこと。',target:'P2/S2=6.0m · P3/S3=4.0m'},
 {level:3,title:'SHIP CONDITION',desc:'タンク指定なしで姿勢を整える',hint:'どのタンクを操作するかは自由です。Mean Draft、Trim、Heelを同時にターゲットへ近づけます。',target:'Mean 7.90m · Trim ±0.15m · Heel ±0.20°'},
 {level:4,title:'MAIN → EDUCTOR',desc:'高速排出からStrippingへ切替',hint:'Main suctionは約1.0mで限界です。吸入圧・流量低下を見て停止し、GS PUMP＋EDUCTORへ切替えてください。',target:'No.4 P/S <0.15m · Main→Eductor'},
 {level:5,title:'BALLAST PLAN',desc:'最終船体状態だけを指定',hint:'初期姿勢は不均衡です。使用タンクは指定しません。最終Draft/Trim/Heelを満足させてください。',target:'Mean 7.90m · Trim ±0.10m · Heel ±0.15°'},
]

const levelOf=(s:ReturnType<typeof useSimStore.getState>,id:string)=>{const t=s.tanks[id];return t.tankHeight*t.volume/t.capacity}

export function ScenarioPanel(){
 const s=useSimStore(); const [hint,setHint]=useState(false)
 const info=levelInfo[s.missionLevel-1]||levelInfo[0]
 const complete=useMemo(()=>{
  if(s.mode!=='MISSION')return false
  if(s.missionLevel===1)return Math.abs(levelOf(s,'P2')-5.0)<=.10
  if(s.missionLevel===2)return Math.abs(levelOf(s,'P2')-6)<=.15&&Math.abs(levelOf(s,'S2')-6)<=.15&&Math.abs(levelOf(s,'P3')-4)<=.15&&Math.abs(levelOf(s,'S3')-4)<=.15&&s.shipCondition.heelDeg<=.25
  if(s.missionLevel===3)return Math.abs(s.shipCondition.meanDraft-7.90)<=.10&&Math.abs(s.shipCondition.trimM)<=.15&&s.shipCondition.heelDeg<=.20
  if(s.missionLevel===4)return levelOf(s,'P4')<.15&&levelOf(s,'S4')<.15
  return Math.abs(s.shipCondition.meanDraft-7.90)<=.08&&Math.abs(s.shipCondition.trimM)<=.10&&s.shipCondition.heelDeg<=.15
 },[s.mode,s.missionLevel,s.tanks,s.shipCondition])
 useEffect(()=>{if(complete)s.completeMission(s.missionLevel)},[complete,s.missionLevel,s.completeMission])

 if(s.mode==='FREE')return <div className="card compact-card mission-card mode-card">
  <div className="card-title-row"><h3>FREE OPERATION</h3><span className="level-pill">NO SCORE</span></div>
  <b className="mission-title">自由操作モード</b>
  <div className="hint-box">配管・弁・ポンプ・Gravity・Eductorを自由に操作できます。危険なラインアップではAlarmは発生しますが、クリア条件はありません。</div>
 </div>

 if(s.mode==='CARGO'){
  const pct=Math.min(100,s.cargo.mass/s.cargo.targetMass*100)
  const within=s.shipCondition.heelDeg<=.30&&Math.abs(s.shipCondition.trimM)<=.20
  return <div className="card compact-card mission-card cargo-card">
   <div className="card-title-row"><h3>CARGO OPERATION</h3><span className={`level-pill ${within?'cargo-ok':'cargo-warn'}`}>{within?'IN BAND':'CORRECT'}</span></div>
   <b className="mission-title">AUTO LOADING + BALLAST CONTROL</b>
   <div className="cargo-progress"><i style={{width:`${pct}%`}}/></div>
   <div className="mission-targets"><span>CARGO<b>{s.cargo.mass.toFixed(0)} / {s.cargo.targetMass.toFixed(0)} t</b></span><span>RATE<b>{s.cargo.loadingRateTph.toFixed(0)} t/h</b></span><span>HEEL<b>{s.shipCondition.heelDeg.toFixed(2)}°</b></span></div>
   <div className="mission-step"><small>OPERATION TARGET</small><b>荷役を継続しながら HEEL ±0.30° / TRIM ±0.20m を維持</b></div>
   <div className="mission-actions"><button onClick={()=>s.setCargoRunning(!s.cargo.running)}>{s.cargo.running?'STOP CARGO':'START CARGO'}</button><button onClick={s.resetCargo}>RESET CARGO</button></div>
   <div className="hint-box">Cargoは船尾寄り・PORT偏心の仮想荷重として自動増加します。BallastでTrim/Heelを相殺してください。最終的には荷役パターンを複数化します。</div>
  </div>
 }

 return <div className={`card compact-card mission-card ${complete?'mission-complete':''}`}>
  <div className="card-title-row"><h3>MISSION TRAINING</h3><span className="level-pill">LV.{s.missionLevel}</span></div>
  <b className="mission-title">{info.title}</b>
  <small className="mission-desc">{info.desc}</small>
  <div className="mission-step"><small>TARGET</small><b>{info.target}</b></div>
  <div className="mission-targets"><span>MEAN DRAFT<b>{s.shipCondition.meanDraft.toFixed(2)} m</b></span><span>TRIM<b>{s.shipCondition.trimM.toFixed(2)} m</b></span><span>HEEL<b>{s.shipCondition.heelDeg.toFixed(2)}°</b></span></div>
  {s.missionLevel===4&&<div className="mission-targets"><span>No.4 P<b>{levelOf(s,'P4').toFixed(2)} m</b></span><span>No.4 S<b>{levelOf(s,'S4').toFixed(2)} m</b></span><span>EDUCTOR<b>{s.eductor.suctionFlow.toFixed(0)} m³/h</b></span></div>}
  {complete&&<div className="mission-success">MISSION COMPLETE</div>}
  <div className="mission-actions"><button onClick={()=>setHint(v=>!v)}>{hint?'HIDE HINT':'HINT'}</button><button onClick={()=>s.loadMission(s.missionLevel)}>RESTART</button><button className="skip-btn" onClick={s.skipMission}>SKIP ▶</button></div>
  {hint&&<div className="hint-box">{info.hint}</div>}
  <div className="level-strip">{levelInfo.map(x=><button key={x.level} className={`${x.level===s.missionLevel?'current':''} ${s.completedLevels.includes(x.level)?'done':''} ${s.skippedLevels.includes(x.level)?'skipped':''}`} onClick={()=>s.loadMission(x.level)}>{x.level}</button>)}</div>
 </div>
}
