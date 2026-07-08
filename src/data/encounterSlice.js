export const SPAWN_POINTS=Object.freeze({nw:{x:170,y:150},n:{x:800,y:150},ne:{x:1430,y:150},w:{x:170,y:450},e:{x:1430,y:450},sw:{x:170,y:740},s:{x:800,y:740},se:{x:1430,y:740}});
const wave=(id,label,spawns,{introMs=500,recoveryMs=650,spawnIntervalMs=420}={})=>Object.freeze({id,label,spawns:Object.freeze(spawns.map(Object.freeze)),introMs,recoveryMs,spawnIntervalMs});
export const ENCOUNTER_SLICE=Object.freeze({
 1:Object.freeze([
  wave('drifter-signal','Drifter Signal',[{type:'drifter',point:'nw'},{type:'drifter',point:'ne'},{type:'drifter',point:'n'}]),
  wave('sentry-lock','Sentry Lock',[{type:'sentry',point:'nw'},{type:'drifter',point:'se'}]),
  wave('mixed-gate','Mixed Gate',[{type:'drifter',point:'w'},{type:'drifter',point:'e'},{type:'sentry',point:'n'}]),
 ]),
 2:Object.freeze([
  wave('mixed-opening','Mixed Opening',[{type:'drifter',point:'nw'},{type:'sentry',point:'ne'},{type:'drifter',point:'s'}]),
  wave('sentry-grid','Sentry Grid',[{type:'sentry',point:'nw'},{type:'sentry',point:'ne'},{type:'drifter',point:'w'}],{recoveryMs:750}),
  wave('final-pressure','Final Mixed Pressure',[{type:'drifter',point:'nw'},{type:'drifter',point:'ne'},{type:'drifter',point:'w'},{type:'sentry',point:'e'}]),
 ]),
});
