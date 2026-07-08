export function clampVelocity(x,y,max){const l=Math.hypot(x,y);if(l<=max||l===0)return{x,y};return{x:x/l*max,y:y/l*max};}
export function seekVelocity(self,target,speed){const dx=target.x-self.x,dy=target.y-self.y,l=Math.hypot(dx,dy)||1;return{x:dx/l*speed,y:dy/l*speed};}
export function separationVelocity(self,neighbours,radius,strength){let x=0,y=0;for(const n of neighbours){if(n===self||!n.active)continue;const dx=self.x-n.x,dy=self.y-n.y,d=Math.hypot(dx,dy);if(d>0&&d<radius){const f=(1-d/radius)*strength;x+=dx/d*f;y+=dy/d*f;}}return{x,y};}
