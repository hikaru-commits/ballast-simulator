export type ValveKind = 'isolation' | 'control'
export type ValveState = 'closed' | 'opening' | 'open' | 'closing' | 'failed'
export interface Valve { id:string; name:string; kind:ValveKind; opening:number; target:number; travelTime:number; state:ValveState }
export interface Pump {
 id:string; name:string; running:boolean; trip:boolean; rpm:number; ratedRpm:number; speedTarget:number; vfd:boolean;
 flow:number; suctionPressure:number; dischargePressure:number; current:number; temperature:number
}
export interface Tank {
 id:string; name:string; side:'port'|'starboard'|'center'; capacity:number; volume:number; lcg:number; tcg:number;
 fsLength:number; fsBreadth:number; tankHeight:number; bottomElevation:number
}
export interface ShipCondition {
 heelDeg:number; heelSide:'PORT'|'STBD'|'UPRIGHT'; trimM:number; trimDirection:'BY BOW'|'BY STERN'|'EVEN';
 draftF:number; draftA:number; meanDraft:number;
 displacement:number; baseGM:number; effectiveGM:number; freeSurfaceCorrection:number; totalFSM:number; slackTankCount:number;
 stabilityStatus:'NORMAL'|'CAUTION'|'LOW GM'|'CRITICAL'
}
export interface SystemStatus {
 mode:'IDLE'|'BALLAST'|'DEBALLAST'|'TRANSFER'|'GRAVITY FILL'|'GRAVITY DISCHARGE'|'GRAVITY TRANSFER'|'DEADHEAD'|'CONFLICT';
 source:string; sink:string; totalFlow:number; portMainFlow:number; stbdMainFlow:number
}
export interface Alarm { id:string; severity:'INFO'|'CAUTION'|'WARNING'|'TRIP'; message:string; ack:boolean; active:boolean; time:string }
export interface EventItem { id:string; time:string; message:string }
export type PipeFillMap = Record<string, number>
export type PipeFlowMap = Record<string, number>
export type GravityFlowMap = Record<string, number>
