export class BossArenaAdapter {
  constructor(descriptor){this.descriptor=descriptor;this.bounds=descriptor.cameraBounds;this.center=Object.freeze({x:800,y:450});this.shell=descriptor.solidGeometry.find((solid)=>solid.id==='boss-core')??Object.freeze({id:'boss-core',x:800,y:450,width:260,height:260});}
  panelPosition(id,distance=174){const angles={north:-Math.PI/2,east:0,south:Math.PI/2,west:Math.PI};const angle=angles[id]??0;return Object.freeze({x:this.center.x+Math.cos(angle)*distance,y:this.center.y+Math.sin(angle)*distance,angle});}
  hostileEchoSockets(){return Object.freeze([{x:250,y:180},{x:1350,y:180},{x:250,y:720},{x:1350,y:720}].map(Object.freeze));}
  summonSockets(){return Object.freeze([{x:230,y:210},{x:800,y:120},{x:1370,y:210},{x:230,y:690},{x:800,y:780},{x:1370,y:690}].map(Object.freeze));}
}
