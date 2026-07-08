import { COMBAT_SAFE_HEIGHT, COMBAT_SAFE_WIDTH, DESIGN_HEIGHT, DESIGN_WIDTH } from './constants.js';
const cx=DESIGN_WIDTH/2,cy=DESIGN_HEIGHT/2,left=cx-COMBAT_SAFE_WIDTH/2,right=cx+COMBAT_SAFE_WIDTH/2,top=cy-COMBAT_SAFE_HEIGHT/2,bottom=cy+COMBAT_SAFE_HEIGHT/2,t=48;
const rect=(id,x,y,width,height,kind='solid')=>Object.freeze({id,x,y,width,height,kind});
const point=(id,x,y,extra={})=>Object.freeze({id,x,y,radius:56,facing:Object.freeze({x:x<cx?1:-1,y:y<cy?1:-1}),roleTags:Object.freeze(['PRESSURE','RANGED','BURST','SPAWNER','DEFENDER','CONTROL']),rangeTags:Object.freeze(['near','mid','far']),largeEnemyAllowed:true,lancerLaneId:`lane-${id}`,lineOfSightIds:Object.freeze(['center']),minimumPlayerDistance:260,...extra});
const outer=()=>[
 rect('outer-top',cx,top+t/2,COMBAT_SAFE_WIDTH,t),rect('outer-bottom',cx,bottom-t/2,COMBAT_SAFE_WIDTH,t),
 rect('outer-left',left+t/2,cy,t,COMBAT_SAFE_HEIGHT-t*2),rect('outer-right',right-t/2,cy,t,COMBAT_SAFE_HEIGHT-t*2),
];
const sockets=()=>[
 point('nw',220,180,{radius:44}),point('n',800,180,{radius:44}),point('ne',1380,180,{radius:44}),point('w',220,450,{radius:44}),point('e',1380,450,{radius:44}),point('sw',220,720,{radius:44}),point('s',800,720,{radius:44}),point('se',1380,720,{radius:44}),
 point('inner-nw',430,265,{radius:48}),point('inner-ne',1170,265,{radius:48}),point('inner-sw',430,635,{radius:48}),point('inner-se',1170,635,{radius:48}),
];
const hazardSockets=()=>[
 Object.freeze({id:'h-nw',x:430,y:270,radius:54,orientation:'horizontal'}),Object.freeze({id:'h-ne',x:1170,y:270,radius:54,orientation:'vertical'}),
 Object.freeze({id:'h-c',x:800,y:450,radius:54,orientation:'horizontal'}),Object.freeze({id:'h-sw',x:430,y:630,radius:54,orientation:'vertical'}),Object.freeze({id:'h-se',x:1170,y:630,radius:54,orientation:'horizontal'}),
];
const safeZones=()=>[Object.freeze({id:'safe-south',x:800,y:710,radius:150}),Object.freeze({id:'safe-west',x:260,y:450,radius:110}),Object.freeze({id:'safe-east',x:1340,y:450,radius:110})];
const circleRectClear=(socket,radius,wall)=>{const closestX=Math.max(wall.x-wall.width/2,Math.min(socket.x,wall.x+wall.width/2)),closestY=Math.max(wall.y-wall.height/2,Math.min(socket.y,wall.y+wall.height/2));return Math.hypot(socket.x-closestX,socket.y-closestY)>=radius;};
const make=(id,label,identity,interior,{transforms=['identity','rotate-180','mirror-x','mirror-y'],stageTags=['combat','elite'],forbiddenEncounterTags=[],hazards=['none','pulse-nodes','conduit-sweep'],spawn={x:800,y:710}}={})=>{const solids=[...outer(),...interior],allSockets=sockets(),enemySockets=allSockets.filter(socket=>solids.every(wall=>circleRectClear(socket,socket.radius,wall))),eliteSockets=allSockets.filter(socket=>['n','ne','nw','e','w'].includes(socket.id)&&solids.every(wall=>circleRectClear(socket,Math.max(70,socket.radius),wall)));return Object.freeze({
 id,label,identity,version:1,width:DESIGN_WIDTH,height:DESIGN_HEIGHT,playerSpawn:Object.freeze(spawn),cameraBounds:Object.freeze({x:0,y:0,width:DESIGN_WIDTH,height:DESIGN_HEIGHT,left:0,right:DESIGN_WIDTH,top:0,bottom:DESIGN_HEIGHT}),
 solids:Object.freeze(solids),enemySockets:Object.freeze(enemySockets),eliteSockets:Object.freeze(eliteSockets),hazardSockets:Object.freeze(hazardSockets()),safeZones:Object.freeze(safeZones()),navigationZones:Object.freeze([Object.freeze({id:'main',x:left+t,y:top+t,width:COMBAT_SAFE_WIDTH-t*2,height:COMBAT_SAFE_HEIGHT-t*2})]),lineOfSightMetadata:Object.freeze({center:Object.freeze({x:800,y:450}),lanes:Object.freeze(['horizontal','vertical','diagonal'])}),tags:Object.freeze(stageTags),forbiddenEncounterTags:Object.freeze(forbiddenEncounterTags),decorationAnchors:Object.freeze([{id:'north-support',x:800,y:90},{id:'south-support',x:800,y:810}]),validTransformIds:Object.freeze(transforms),hazardConfigurationIds:Object.freeze(hazards),validationVersion:1,
});};
export const ARENA_TEMPLATE_DEFINITIONS=Object.freeze([
 make('open-circle','Open Circular Chamber','radial-seams',[],{stageTags:['combat','elite','opening','lancer','ranged','full-roster','recovery']}),
 make('split-pillars','Split Central Pillars','paired-monoliths',[rect('pillar-left',610,450,100,340),rect('pillar-right',990,450,100,340)],{stageTags:['combat','elite','lancer','ranged','full-roster']}),
 make('four-corners','Four-Corner Cover','corner-reactors',[rect('reactor-nw',430,285,150,130),rect('reactor-ne',1170,285,150,130),rect('reactor-sw',430,615,150,130),rect('reactor-se',1170,615,150,130)],{stageTags:['combat','elite','ranged','full-roster']}),
 make('side-channels','Narrow Side Channels','conduit-trenches',[rect('channel-left',500,450,120,450),rect('channel-right',1100,450,120,450)],{transforms:['identity','rotate-180','mirror-x'],stageTags:['combat','lancer','ranged','full-roster']}),
 make('broken-ring','Broken Ring','interrupted-radial',[rect('ring-n',800,260,500,70),rect('ring-sw',555,575,300,70),rect('ring-se',1045,575,300,70)],{transforms:['identity','rotate-180','mirror-x','mirror-y'],stageTags:['combat','elite','lancer','full-roster']}),
 make('offset-core','Offset Central Structure','asymmetric-reactor',[rect('core',675,420,250,250),rect('spur',980,570,250,80)],{transforms:['identity','rotate-180','mirror-x','mirror-y'],stageTags:['combat','elite','ranged','full-roster']}),
 make('twin-islands','Twin Islands','linked-platforms',[rect('island-left',520,450,260,220),rect('island-right',1080,450,260,220),rect('bridge-n',800,300,240,60),rect('bridge-s',800,600,240,60)],{transforms:['identity','rotate-180','mirror-y'],stageTags:['combat','elite','ranged','full-roster']}),
 make('boss-chamber','Boss Chamber','integrated-central-machine',[rect('boss-core',800,450,260,260)],{transforms:['identity'],stageTags:['boss'],hazards:['none'],spawn:{x:800,y:720}}),
]);
export const ARENA_TEMPLATES_BY_ID=Object.freeze(Object.fromEntries(ARENA_TEMPLATE_DEFINITIONS.map(tpl=>[tpl.id,tpl])));
