var Ye=Object.defineProperty,Re=f=>{throw TypeError(f)},Fe=(f,t,e)=>t in f?Ye(f,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):f[t]=e,k=(f,t,e)=>Fe(f,typeof t!="symbol"?t+"":t,e),me=(f,t,e)=>t.has(f)||Re("Cannot "+e),p=(f,t,e)=>(me(f,t,"read from private field"),e?e.call(f):t.get(f)),Y=(f,t,e)=>t.has(f)?Re("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(f):t.set(f,e),N=(f,t,e,i)=>(me(f,t,"write to private field"),t.set(f,e),e),j=(f,t,e)=>(me(f,t,"access private method"),e),rt,ge,ae,X,Z,pe,Bt,ve,ut,et,Ft,pt,qt,Zt,Vt,$t,jt,Kt,Jt,At,Dt,ie,se,F,kt,W,_e,Qt,V,zt,Xt,$,ot,Lt;class ye{constructor(t={}){this.children=[],this.sortByZIndex=t.sortByZIndex||!0,this._zOrderDirty=!1}add(t){return this.children.includes(t)?(console.warn("Object is already in this collection"),t):(this.children.push(t),t.parent=this._owner||this,this.sortByZIndex&&(this._zOrderDirty=!0,(t.zIndex===void 0||t.zIndex===null)&&(t.zIndex=this.children.length-1)),t)}remove(t){const e=this.children.indexOf(t);return e!==-1?(this.children.splice(e,1),t.parent=null,!0):!1}clear(){this.children.forEach(t=>{t.parent=null}),this.children=[]}bringToFront(t){const e=this.children.indexOf(t);if(e===-1){this.add(t);return}if(this.sortByZIndex){let i=!0;for(const s of this.children)if(s!==t&&(s.zIndex||0)>=(t.zIndex||0)){i=!1;break}i||(t.zIndex=Number.MAX_SAFE_INTEGER,this._zOrderDirty=!0,this._normalizeZIndices())}else e!==this.children.length-1&&(this.children.splice(e,1),this.children.push(t))}sendToBack(t){const e=this.children.indexOf(t);if(e===-1){this.children.unshift(t),t.parent=this._owner||this;return}if(this.sortByZIndex){let i=!0;for(const s of this.children)if(s!==t&&(s.zIndex||0)<=(t.zIndex||0)){i=!1;break}i||(t.zIndex=Number.MIN_SAFE_INTEGER,this._zOrderDirty=!0,this._normalizeZIndices())}else e!==0&&(this.children.splice(e,1),this.children.unshift(t))}bringForward(t){const e=this.children.indexOf(t);if(!(e===-1||e===this.children.length-1))if(this.sortByZIndex){const i=[...this.children].sort((a,o)=>(a.zIndex||0)-(o.zIndex||0)),s=i.indexOf(t);if(s<i.length-1){const a=i[s+1],o=a.zIndex||0,r=t.zIndex||0;o-r>1?t.zIndex=r+Math.floor((o-r)/2):(t.zIndex=o,a.zIndex=r),this._zOrderDirty=!0,this._normalizeZIndices()}}else{const i=this.children[e+1];this.children[e+1]=t,this.children[e]=i}}sendBackward(t){const e=this.children.indexOf(t);if(!(e<=0))if(this.sortByZIndex){const i=[...this.children].sort((a,o)=>(a.zIndex||0)-(o.zIndex||0)),s=i.indexOf(t);if(s>0){const a=i[s-1],o=a.zIndex||0,r=t.zIndex||0;r-o>1?t.zIndex=o+Math.floor((r-o)/2):(t.zIndex=o,a.zIndex=r),this._zOrderDirty=!0,this._normalizeZIndices()}}else{const i=this.children[e-1];this.children[e-1]=t,this.children[e]=i}}_normalizeZIndices(){if(this.children.length<=1)return;this.children.some(e=>(e.zIndex||0)>1e3||(e.zIndex||0)<-1e3)&&([...this.children].sort((i,s)=>(i.zIndex||0)-(s.zIndex||0)).forEach((i,s)=>{i.zIndex=s*10}),this._zOrderDirty=!0)}getSortedChildren(){return this.sortByZIndex&&this._zOrderDirty&&(this.children.sort((t,e)=>(t.zIndex||0)-(e.zIndex||0)),this._zOrderDirty=!1),this.children}}const Ct=class vt{static calculate(t,e,i,s=10,a=0,o=0){const r=e.width||0,n=e.height||0,c=i.width||0,l=i.height||0,u=i.x||0,h=i.y||0;let d,g,v,_;switch(t){case vt.TOP_LEFT:d=u-c/2+s+r/2,g=h-l/2+s+n/2,v="left",_="top";break;case vt.TOP_CENTER:d=u,g=h-l/2+s+n/2,v="center",_="top";break;case vt.TOP_RIGHT:d=u+c/2-s-r/2,g=h-l/2+s+n/2,v="right",_="top";break;case vt.CENTER_LEFT:d=u-c/2+s+r/2,g=h,v="left",_="middle";break;case vt.CENTER:d=u,g=h,v="center",_="middle";break;case vt.CENTER_RIGHT:d=u+c/2-s-r/2,g=h,v="right",_="middle";break;case vt.BOTTOM_LEFT:d=u-c/2+s+r/2,g=h+l/2-s-n/2,v="left",_="bottom";break;case vt.BOTTOM_CENTER:d=u,g=h+l/2-s-n/2,v="center",_="bottom";break;case vt.BOTTOM_RIGHT:d=u+c/2-s-r/2,g=h+l/2-s-n/2,v="right",_="bottom";break;default:d=u-c/2+s+r/2,g=h-l/2+s+n/2,v="left",_="top"}return d+=a,g+=o,{x:d,y:g,align:v,baseline:_}}static calculateAbsolute(t,e,i,s=10,a=0,o=0){const r={width:i.width,height:i.height,x:i.width/2,y:i.height/2};return vt.calculate(t,e,r,s,a,o)}};k(Ct,"TOP_LEFT","top-left");k(Ct,"TOP_CENTER","top-center");k(Ct,"TOP_RIGHT","top-right");k(Ct,"CENTER_LEFT","center-left");k(Ct,"CENTER","center");k(Ct,"CENTER_RIGHT","center-right");k(Ct,"BOTTOM_LEFT","bottom-left");k(Ct,"BOTTOM_CENTER","bottom-center");k(Ct,"BOTTOM_RIGHT","bottom-right");let we=Ct;class Mi{constructor(t={}){this.rotationX=t.rotationX??0,this.rotationY=t.rotationY??0,this.rotationZ=t.rotationZ??0,this.x=t.x??0,this.y=t.y??0,this.z=t.z??0,this._initialRotationX=this.rotationX,this._initialRotationY=this.rotationY,this._initialRotationZ=this.rotationZ,this._initialX=this.x,this._initialY=this.y,this._initialZ=this.z,this.perspective=t.perspective??800,this.sensitivity=t.sensitivity??.005,this.minRotationX=t.minRotationX??-1.5,this.maxRotationX=t.maxRotationX??1.5,this.clampX=t.clampX??!0,this.autoRotate=t.autoRotate??!1,this.autoRotateSpeed=t.autoRotateSpeed??.5,this.autoRotateAxis=t.autoRotateAxis??"y",this.inertia=t.inertia??!1,this.friction=t.friction??.92,this.velocityScale=t.velocityScale??1,this._velocityX=0,this._velocityY=0,this._lastDeltaX=0,this._lastDeltaY=0,this._lastMoveTime=0,this._isDragging=!1,this._lastMouseX=0,this._lastMouseY=0,this._canvas=null,this._boundHandlers=null,this._followTarget=null,this._followOffset={x:0,y:0,z:0},this._followLookAt=!0,this._followLerp=.1,this._targetX=null,this._targetY=null,this._targetZ=null,this._targetRotationX=null,this._targetRotationY=null,this._positionLerp=.05}project(t,e,i){if(t-=this.x,e-=this.y,i-=this.z,this.rotationZ!==0){const v=Math.cos(this.rotationZ),_=Math.sin(this.rotationZ),b=t,y=e;t=b*v-y*_,e=b*_+y*v}const s=Math.cos(this.rotationY),a=Math.sin(this.rotationY),o=t*s-i*a,r=t*a+i*s,n=Math.cos(this.rotationX),c=Math.sin(this.rotationX),l=e*n-r*c,u=e*c+r*n,h=this.perspective/(this.perspective+u),d=o*h,g=l*h;return{x:d,y:g,z:u,scale:h}}projectAll(t){return t.map(e=>this.project(e.x,e.y,e.z))}update(t){var e,i,s;if(this._followTarget){const a=this._followTarget,o=(a.x??0)+this._followOffset.x,r=(a.y??0)+this._followOffset.y,n=(a.z??0)+this._followOffset.z;if(this.x+=(o-this.x)*this._followLerp,this.y+=(r-this.y)*this._followLerp,this.z+=(n-this.z)*this._followLerp,this._followLookAt){const c=((e=this._followLookAtTarget)==null?void 0:e.x)??0,l=((i=this._followLookAtTarget)==null?void 0:i.y)??0,u=((s=this._followLookAtTarget)==null?void 0:s.z)??0,h=c-this.x,d=l-this.y,g=u-this.z,v=Math.sqrt(h*h+g*g),_=Math.atan2(h,g),b=Math.atan2(-d,v);this.rotationY+=this._angleDiff(this.rotationY,_)*this._followLerp,this.rotationX+=(b-this.rotationX)*this._followLerp}}else if(this._targetX!==null){const a=this._positionLerp;this.x+=(this._targetX-this.x)*a,this.y+=(this._targetY-this.y)*a,this.z+=(this._targetZ-this.z)*a,this._targetRotationX!==null&&(this.rotationX+=(this._targetRotationX-this.rotationX)*a),this._targetRotationY!==null&&(this.rotationY+=this._angleDiff(this.rotationY,this._targetRotationY)*a),Math.abs(this._targetX-this.x)+Math.abs(this._targetY-this.y)+Math.abs(this._targetZ-this.z)<.1&&(this.x=this._targetX,this.y=this._targetY,this.z=this._targetZ,this._targetX=null,this._targetY=null,this._targetZ=null,this._targetRotationX=null,this._targetRotationY=null)}if(this.inertia&&!this._isDragging&&!this._followTarget&&(Math.abs(this._velocityX)>1e-4||Math.abs(this._velocityY)>1e-4)&&(this.rotationY+=this._velocityY,this.rotationX+=this._velocityX,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this._velocityX*=this.friction,this._velocityY*=this.friction,Math.abs(this._velocityX)<1e-4&&(this._velocityX=0),Math.abs(this._velocityY)<1e-4&&(this._velocityY=0)),this.autoRotate&&!this._isDragging&&!this._followTarget&&!(Math.abs(this._velocityX)>.001||Math.abs(this._velocityY)>.001)){const o=this.autoRotateSpeed*t;switch(this.autoRotateAxis){case"x":this.rotationX+=o;break;case"y":this.rotationY+=o;break;case"z":this.rotationZ+=o;break}}}_angleDiff(t,e){let i=e-t;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;return i}enableMouseControl(t,e={}){this._canvas&&this.disableMouseControl(),this._canvas=t;const i=e.invertX?-1:1,s=e.invertY?-1:1;return this._boundHandlers={mousedown:a=>{this._isDragging=!0,this._lastMouseX=a.clientX,this._lastMouseY=a.clientY,this._lastMoveTime=performance.now(),this._velocityX=0,this._velocityY=0},mousemove:a=>{if(!this._isDragging)return;const o=a.clientX-this._lastMouseX,r=a.clientY-this._lastMouseY,n=o*this.sensitivity*i,c=r*this.sensitivity*s;this.rotationY+=n,this.rotationX+=c,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this.inertia&&(this._lastDeltaX=c,this._lastDeltaY=n,this._lastMoveTime=performance.now()),this._lastMouseX=a.clientX,this._lastMouseY=a.clientY},mouseup:()=>{this.inertia&&this._isDragging&&performance.now()-this._lastMoveTime<50&&(this._velocityX=this._lastDeltaX*this.velocityScale,this._velocityY=this._lastDeltaY*this.velocityScale),this._isDragging=!1},mouseleave:()=>{this.inertia&&this._isDragging&&performance.now()-this._lastMoveTime<50&&(this._velocityX=this._lastDeltaX*this.velocityScale,this._velocityY=this._lastDeltaY*this.velocityScale),this._isDragging=!1},touchstart:a=>{a.touches.length===1&&(this._isDragging=!0,this._lastMouseX=a.touches[0].clientX,this._lastMouseY=a.touches[0].clientY,this._lastMoveTime=performance.now(),this._velocityX=0,this._velocityY=0)},touchmove:a=>{if(!this._isDragging||a.touches.length!==1)return;a.preventDefault();const o=a.touches[0].clientX-this._lastMouseX,r=a.touches[0].clientY-this._lastMouseY,n=o*this.sensitivity*i,c=r*this.sensitivity*s;this.rotationY+=n,this.rotationX+=c,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this.inertia&&(this._lastDeltaX=c,this._lastDeltaY=n,this._lastMoveTime=performance.now()),this._lastMouseX=a.touches[0].clientX,this._lastMouseY=a.touches[0].clientY},touchend:()=>{this.inertia&&this._isDragging&&performance.now()-this._lastMoveTime<50&&(this._velocityX=this._lastDeltaX*this.velocityScale,this._velocityY=this._lastDeltaY*this.velocityScale),this._isDragging=!1},dblclick:()=>{this.reset()}},t.addEventListener("mousedown",this._boundHandlers.mousedown),t.addEventListener("mousemove",this._boundHandlers.mousemove),t.addEventListener("mouseup",this._boundHandlers.mouseup),t.addEventListener("mouseleave",this._boundHandlers.mouseleave),t.addEventListener("touchstart",this._boundHandlers.touchstart),t.addEventListener("touchmove",this._boundHandlers.touchmove,{passive:!1}),t.addEventListener("touchend",this._boundHandlers.touchend),t.addEventListener("dblclick",this._boundHandlers.dblclick),this}disableMouseControl(){return this._canvas&&this._boundHandlers&&(this._canvas.removeEventListener("mousedown",this._boundHandlers.mousedown),this._canvas.removeEventListener("mousemove",this._boundHandlers.mousemove),this._canvas.removeEventListener("mouseup",this._boundHandlers.mouseup),this._canvas.removeEventListener("mouseleave",this._boundHandlers.mouseleave),this._canvas.removeEventListener("touchstart",this._boundHandlers.touchstart),this._canvas.removeEventListener("touchmove",this._boundHandlers.touchmove),this._canvas.removeEventListener("touchend",this._boundHandlers.touchend),this._canvas.removeEventListener("dblclick",this._boundHandlers.dblclick)),this._canvas=null,this._boundHandlers=null,this}reset(){return this.rotationX=this._initialRotationX,this.rotationY=this._initialRotationY,this.rotationZ=this._initialRotationZ,this.x=this._initialX,this.y=this._initialY,this.z=this._initialZ,this._velocityX=0,this._velocityY=0,this._followTarget=null,this._targetX=null,this._targetY=null,this._targetZ=null,this}stopInertia(){return this._velocityX=0,this._velocityY=0,this}setPosition(t,e,i){return this.x=t,this.y=e,this.z=i,this}moveTo(t,e,i,s={}){return this._targetX=t,this._targetY=e,this._targetZ=i,this._targetRotationX=s.rotationX??null,this._targetRotationY=s.rotationY??null,this._positionLerp=s.lerp??.05,this}follow(t,e={}){return this._followTarget=t,this._followOffset={x:e.offsetX??0,y:e.offsetY??0,z:e.offsetZ??0},this._followLookAt=e.lookAt??!0,this._followLookAtTarget=e.lookAtTarget??null,this._followLerp=e.lerp??.1,this}unfollow(t=!1){return this._followTarget=null,t&&this.moveTo(this._initialX,this._initialY,this._initialZ,{rotationX:this._initialRotationX,rotationY:this._initialRotationY,lerp:.05}),this}isFollowing(){return this._followTarget!==null}setRotation(t,e,i=0){return this.rotationX=t,this.rotationY=e,this.rotationZ=i,this}rotate(t,e,i=0){return this.rotationX+=t,this.rotationY+=e,this.rotationZ+=i,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this}isDragging(){return this._isDragging}lookAt(t,e,i){const s=t-this.x,a=e-this.y,o=i-this.z,r=Math.sqrt(s*s+o*o);return this.rotationY=Math.atan2(s,o),this.rotationX=Math.atan2(-a,r),this}}class wt{constructor(t,e=0){this.real=t,this.imag=e}static fromPolar(t,e){return new wt(t*Math.cos(e),t*Math.sin(e))}add(t){return new wt(this.real+t.real,this.imag+t.imag)}subtract(t){return new wt(this.real-t.real,this.imag-t.imag)}multiply(t){return new wt(this.real*t.real-this.imag*t.imag,this.real*t.imag+this.imag*t.real)}divide(t){return new wt(this.real/t,this.imag/t)}scale(t){return new wt(this.real*t,this.imag*t)}abs(){return Math.sqrt(this.real*this.real+this.imag*this.imag)}}class Ae{static applyColorScheme(t,e,i,s,a,o){const r=(e==null?void 0:e.data)||[];for(let n=0;n<t.length;n++){const c=t[n],l=n*4;switch(i){case"futuristic":{const u=t[n]/10,h={r:0,g:5,b:10},d={r:0,g:30,b:20};if(u>.7){const g=(u-.7)*3.33;r[l]=Math.floor(h.r*(1-g)+d.r*g),r[l+1]=Math.floor(h.g*(1-g)+d.g*g),r[l+2]=Math.floor(h.b*(1-g)+d.b*g)}else{const g=u*1.43;r[l]=Math.floor(h.r*g),r[l+1]=Math.floor(h.g*g),r[l+2]=Math.floor(h.b*g)}r[l+3]=255}break;case"rainbow":if(c===0)r[l]=0,r[l+1]=0,r[l+2]=0,r[l+3]=255;else{const u=(c*10+a)%360,[h,d,g]=o(u,.8,.5);r[l]=h,r[l+1]=d,r[l+2]=g,r[l+3]=255}break;case"grayscale":{const u=c===0?0:255-c*255/s;r[l]=u,r[l+1]=u,r[l+2]=u,r[l+3]=255}break;case"binary":c!==0?(r[l]=0,r[l+1]=0,r[l+2]=0):(r[l]=255,r[l+1]=255,r[l+2]=255),r[l+3]=255;break;case"fire":{if(c==0)r[l]=0,r[l+1]=0,r[l+2]=0;else{const u=c/s;if(u<.3){const h=u/.3;r[l]=Math.floor(255*h),r[l+1]=0,r[l+2]=0}else if(u<.6){const h=(u-.3)/.3;r[l]=255,r[l+1]=Math.floor(165*h),r[l+2]=0}else if(u<.9){const h=(u-.6)/.3;r[l]=255,r[l+1]=165+Math.floor(90*h),r[l+2]=Math.floor(255*h)}else r[l]=255,r[l+1]=255,r[l+2]=255}r[l+3]=255}break;case"ocean":{if(c===0)r[l]=0,r[l+1]=20,r[l+2]=50;else{const u=c/s;r[l]=Math.floor(10+50*u),r[l+1]=Math.floor(50+150*u),r[l+2]=Math.floor(100+155*u)}r[l+3]=255}break;case"electric":{if(c===0)r[l]=0,r[l+1]=0,r[l+2]=0;else{const u=(c+a)%3,h=c%20/20;u===0?(r[l]=Math.floor(255*(.5+.5*Math.sin(h*Math.PI*2))),r[l+1]=Math.floor(128*h),r[l+2]=Math.floor(255*h)):u===1?(r[l]=Math.floor(255*h),r[l+1]=Math.floor(255*(.5+.5*Math.sin(h*Math.PI*2))),r[l+2]=Math.floor(128*h)):(r[l]=Math.floor(128*h),r[l+1]=Math.floor(255*h),r[l+2]=Math.floor(255*(.5+.5*Math.sin(h*Math.PI*2))))}r[l+3]=255}break;case"topographic":{if(c===0)r[l]=5,r[l+1]=15,r[l+2]=30;else{const u=c/s;if(u<.1){const h=u/.1;r[l]=Math.floor(5+20*h),r[l+1]=Math.floor(15+40*h),r[l+2]=Math.floor(30+50*h)}else if(u<.3){const h=(u-.1)/.2;r[l]=Math.floor(210+45*h),r[l+1]=Math.floor(180+40*h),r[l+2]=Math.floor(140+30*h)}else if(u<.7){const h=(u-.3)/.4;r[l]=Math.floor(50*(1-h)),r[l+1]=Math.floor(100+80*h),r[l+2]=Math.floor(50*(1-h))}else{const h=(u-.7)/.3;r[l]=Math.floor(150+105*h),r[l+1]=Math.floor(150+105*h),r[l+2]=Math.floor(150+105*h)}}r[l+3]=255}break;case"historic":default:{if(c===0)r[l]=0,r[l+1]=0,r[l+2]=0;else{const h=(c+a)%64;h<16?(r[l]=h*16,r[l+1]=0,r[l+2]=0):h<32?(r[l]=255,r[l+1]=(h-16)*16,r[l+2]=0):h<48?(r[l]=255-(h-32)*16,r[l+1]=255,r[l+2]=0):(r[l]=0,r[l+1]=255-(h-48)*16,r[l+2]=(h-48)*16)}r[l+3]=255}}}return e??r}static pythagorasTree(t,e,i=10,s=-2,a=2,o=-.5,r=3.5){const n=new Uint8Array(t*e),c=x=>Math.floor((x-s)*t/(a-s)),l=x=>Math.floor((x-o)*e/(r-o)),u=(x,w,S,C)=>{const T=c(x),R=l(w),A=c(S),I=l(C);let P=T,D=R;const E=Math.abs(A-T),z=Math.abs(I-R),q=T<A?1:-1,J=R<I?1:-1;let H=E-z;for(;P>=0&&P<t&&D>=0&&D<e&&(n[D*t+P]=255),!(P===A&&D===I);){const nt=2*H;nt>-z&&(H-=z,P+=q),nt<E&&(H+=E,D+=J)}},h=(x,w,S,C,T,R,A,I)=>{u(x,w,S,C),u(S,C,T,R),u(T,R,A,I),u(A,I,x,w)},d=(x,w,S,C,T)=>{if(T<=0)return;const R=S-x,A=C-w,I=S+A,P=C-R,D=x+A,E=w-R;h(x,w,S,C,I,P,D,E);const z=Math.PI/4,q=Math.sqrt(R*R+A*A)*.7,J=q*Math.cos(Math.atan2(A,R)-z),H=q*Math.sin(Math.atan2(A,R)-z),nt=Math.sqrt(R*R+A*A)*.7,Rt=nt*Math.cos(Math.atan2(A,R)+z),St=nt*Math.sin(Math.atan2(A,R)+z),lt=I,Q=P,K=D,it=E,Yt=lt+J,It=Q+H,Ht=K+Rt,mt=it+St;d(lt,Q,Yt,It,T-1),d(K,it,Ht,mt,T-1)},g=Math.min(i,12),v=1,_=-1/2,b=0,y=v/2;return d(_,b,y,0,g),n}static mandelbrot(t,e,i=100,s=-2.5,a=1,o=-1.5,r=1.5){const n=new Uint8Array(t*e),c=(a-s)/t,l=(r-o)/e;for(let u=0;u<e;u++){const h=u*t,d=o+u*l;for(let g=0;g<t;g++){const v=s+g*c;let _=0,b=0,y=0,M=0,x=0;do{const w=y-M+v;b=2*_*b+d,_=w,y=_*_,M=b*b,x++}while(y+M<4&&x<i);n[h+g]=x<i?x%256:0}}return n}static julia(t,e,i=100,s=-.7,a=.27,o=1,r=0,n=0){const c=new Uint8Array(t*e),l=2/o,u=-l+r,h=l+r,d=-l+n,g=l+n,v=(h-u)/t,_=(g-d)/e;for(let b=0;b<e;b++){const y=b*t,M=d+b*_;for(let x=0;x<t;x++){let S=u+x*v,C=M,T=0,R=0,A=0;do{T=S*S,R=C*C;const I=T-R+s;C=2*S*C+a,S=I,A++}while(T+R<4&&A<i);c[y+x]=A<i?A%256:0}}return c}static tricorn(t,e,i=100,s=-2.5,a=1.5,o=-1.5,r=1.5){const n=new Uint8Array(t*e),c=(a-s)/t,l=(r-o)/e;for(let u=0;u<e;u++){const h=u*t,d=o+u*l;for(let g=0;g<t;g++){const v=s+g*c;let _=0,b=0,y=0,M=0,x=0;do{const w=y-M+v;b=-2*_*b+d,_=w,y=_*_,M=b*b,x++}while(y+M<4&&x<i);n[h+g]=x<i?x%256:0}}return n}static phoenix(t,e,i=100,s=.5,a=.5,o=-2,r=2,n=-2,c=2){const l=new Uint8Array(t*e),u=(r-o)/t,h=(c-n)/e;for(let d=0;d<e;d++){const g=d*t,v=n+d*h;for(let _=0;_<t;_++){const b=o+_*u;let y=0,M=0,x=0,w=0,S=0,C=0,T=0;do{const R=S-C+b+s*x+a,A=2*y*M+v+s*w;x=y,w=M,y=R,M=A,S=y*y,C=M*M,T++}while(S+C<4&&T<i);l[g+_]=T<i?T%256:0}}return l}static newton(t,e,i=100,s=1e-6,a=-2,o=2,r=-2,n=2){const c=new Uint8Array(t*e),l=s*s,u=o-a,h=n-r,d=3,g=new Float64Array(d),v=new Float64Array(d);for(let y=0;y<d;y++){const M=2*Math.PI*y/d;g[y]=Math.cos(M),v[y]=Math.sin(M)}const _=u/t,b=h/e;for(let y=0;y<e;y++){const M=y*t,x=r+y*b;for(let w=0;w<t;w++){let C=a+w*_,T=x,R=0,A=-1;for(;R<i&&A<0;){const I=C*C-T*T,P=2*C*T,D=I*C-P*T-1,E=I*T+P*C,z=3*I,q=3*P,J=z*z+q*q;if(J<l)break;const H=1/J,nt=(D*z+E*q)*H,Rt=(E*z-D*q)*H,St=C-nt,lt=T-Rt;for(let Q=0;Q<d;Q++){const K=St-g[Q],it=lt-v[Q];if(K*K+it*it<l){A=Q;break}}C=St,T=lt,R++}if(A>=0){const I=1-Math.min(R/i,1),P=A*(255/d);c[M+w]=Math.floor(P+I*(255/d))}else c[M+w]=0}}return c}static sierpinski(t,e,i=6,s=0,a=1,o=0,r=1){const n=new Uint8Array(t*e).fill(1),c=Math.sqrt(3)/2,l=a-s,h=(r-o)/l;if(Math.abs(h-c)>1e-9){const y=(o+r)/2,M=l*c;o=y-M/2,r=y+M/2}const g=(1<<Math.min(i,32))-1,v=(a-s)/t,_=(r-o)/e,b=2/Math.sqrt(3);for(let y=0;y<e;++y){const M=o+y*_,x=Math.floor(M*b),w=x*.5;for(let S=0;S<t;++S){const C=s+S*v;Math.floor(C-w)&x&g&&(n[y*t+S]=0)}}return n}static sierpinskiCarpet(t,e,i=5,s=0,a=1,o=0,r=1){const n=new Uint8Array(t*e).fill(1),c=a-s,l=r-o,u=Math.max(c,l),h=(s+a)/2,d=(o+r)/2;s=h-u/2,a=h+u/2,o=d-u/2,r=d+u/2;const g=Math.pow(3,i),v=(_,b)=>{let y=_,M=b;for(;y>0||M>0;){if(y%3===1&&M%3===1)return!0;y=Math.floor(y/3),M=Math.floor(M/3)}return!1};for(let _=0;_<e;++_){const y=(o+_/e*(r-o))*g,M=(Math.floor(y)%g+g)%g;for(let x=0;x<t;++x){const S=(s+x/t*(a-s))*g,C=(Math.floor(S)%g+g)%g;v(C,M)&&(n[_*t+x]=0)}}return n}static barnsleyFern(t,e,i=1e5){const s=new Uint8Array(t*e).fill(0);let a=0,o=0;const r=Math.min(t,e)/10,n=t/2;for(let c=0;c<i;c++){const l=Math.random();let u,h;l<.01?(u=0,h=.16*o):l<.86?(u=.85*a+.04*o,h=-.04*a+.85*o+1.6):l<.93?(u=.2*a-.26*o,h=.23*a+.22*o+1.6):(u=-.15*a+.28*o,h=.26*a+.24*o+.44),a=u,o=h;const d=Math.floor(a*r+n),g=Math.floor(e-o*r);if(d>=0&&d<t&&g>=0&&g<e){const v=g*t+d;s[v]<255&&s[v]++}}return s}static lyapunov(t,e,i=1e3,s="AB",a=3.4,o=4,r=3.4,n=4){console.time("lyapunov"),s=s.toUpperCase().replace(/[^AB]/g,"")||"AB";const c=s.length,l=new Float32Array(t*e);let u=1/0,h=-1/0;for(let v=0;v<e;v++){const _=r+(n-r)*v/e;for(let b=0;b<t;b++){const y=a+(o-a)*b/t;let M=.5;for(let C=0;C<100;C++)M=(s[C%c]==="A"?y:_)*M*(1-M);let x=0,w=0;for(;w<i;){const C=s[w%c]==="A"?y:_;M=C*M*(1-M);const T=Math.abs(C*(1-2*M));if(x+=Math.log(Math.max(T,1e-10)),w++,Math.abs(x/w)>10)break}const S=x/w;l[v*t+b]=S,S>-10&&S<10&&(S<u&&(u=S),S>h&&(h=S))}}u===h&&(u-=1,h+=1);const d=h-u,g=new Uint8Array(t*e);for(let v=0;v<l.length;v++){let _=l[v];_=Math.max(-10,Math.min(10,_));let b=(_-u)/d;g[v]=Math.floor(b*255)}return console.timeEnd("lyapunov"),g}static koch(t,e,i=4,s=-2,a=2,o=-2,r=2){const n=new Uint8Array(t*e),c=M=>Math.floor((M-s)*t/(a-s)),l=M=>Math.floor((M-o)*e/(r-o)),u=(M,x,w,S)=>{const C=c(M),T=l(x),R=c(w),A=l(S);let I=C,P=T;const D=Math.abs(R-C),E=Math.abs(A-T),z=C<R?1:-1,q=T<A?1:-1;let J=D-E;for(;I>=0&&I<t&&P>=0&&P<e&&(n[P*t+I]=255),!(I===R&&P===A);){const H=2*J;H>-E&&(J-=E,I+=z),H<D&&(J+=D,P+=q)}},h=(M,x,w,S,C)=>{if(C<=0){u(M,x,w,S);return}const T=(w-M)/3,R=(S-x)/3,A=M+T,I=x+R,P=M+2*T,D=x+2*R,E=Math.PI/3,z=A+T*Math.cos(E)-R*Math.sin(E),q=I+T*Math.sin(E)+R*Math.cos(E);h(M,x,A,I,C-1),h(A,I,z,q,C-1),h(z,q,P,D,C-1),h(P,D,w,S,C-1)},d=Math.min(i,10),g=3,v=g*Math.sqrt(3)/2,_=[0,-v/2+.5],b=[-3/2,v/2+.5],y=[g/2,v/2+.5];return h(_[0],_[1],b[0],b[1],d),h(b[0],b[1],y[0],y[1],d),h(y[0],y[1],_[0],_[1],d),n}}k(Ae,"types",{MANDELBROT:"mandelbrot",TRICORN:"tricorn",PHOENIX:"phoenix",JULIA:"julia",SIERPINSKI:"sierpinski",SCARPET:"sierpinskiCarpet",BARNSEY_FERN:"barnsleyFern",KOCH:"koch",PYTHAGORAS_TREE:"pythagorasTree",NEWTON:"newton",LYAPUNOV:"lyapunov"});k(Ae,"colors",{FUTURISTIC:"futuristic",RAINBOW:"rainbow",GRAYSCALE:"grayscale",TOPOGRAPHIC:"topographic",FIRE:"fire",OCEAN:"ocean",ELECTRIC:"electric",BINARY:"binary",HISTORIC:"historic"});const U=class{static seed(t){t>0&&t<1&&(t*=65536),t=Math.floor(t),t<256&&(t|=t<<8);for(let e=0;e<256;e++){let i;e&1?i=p(this,ae)[e]^t&255:i=p(this,ae)[e]^t>>8&255,p(this,X)[e]=p(this,X)[e+256]=i,p(this,Z)[e]=p(this,Z)[e+256]=p(this,ge)[i%12]}}static simplex2(t,e){let i,s,a;const o=(t+e)*p(this,pe),r=Math.floor(t+o),n=Math.floor(e+o),c=(r+n)*p(this,Bt),l=t-r+c,u=e-n+c;let h,d;l>u?(h=1,d=0):(h=0,d=1);const g=l-h+p(this,Bt),v=u-d+p(this,Bt),_=l-1+2*p(this,Bt),b=u-1+2*p(this,Bt),y=r&255,M=n&255,x=p(this,Z)[y+p(this,X)[M]],w=p(this,Z)[y+h+p(this,X)[M+d]],S=p(this,Z)[y+1+p(this,X)[M+1]];let C=.5-l*l-u*u;C<0?i=0:(C*=C,i=C*C*x.dot2(l,u));let T=.5-g*g-v*v;T<0?s=0:(T*=T,s=T*T*w.dot2(g,v));let R=.5-_*_-b*b;return R<0?a=0:(R*=R,a=R*R*S.dot2(_,b)),70*(i+s+a)}static simplex3(t,e,i){let s,a,o,r;const n=(t+e+i)*p(this,ve),c=Math.floor(t+n),l=Math.floor(e+n),u=Math.floor(i+n),h=(c+l+u)*p(this,ut),d=t-c+h,g=e-l+h,v=i-u+h;let _,b,y,M,x,w;d>=g?g>=v?(_=1,b=0,y=0,M=1,x=1,w=0):d>=v?(_=1,b=0,y=0,M=1,x=0,w=1):(_=0,b=0,y=1,M=1,x=0,w=1):g<v?(_=0,b=0,y=1,M=0,x=1,w=1):d<v?(_=0,b=1,y=0,M=0,x=1,w=1):(_=0,b=1,y=0,M=1,x=1,w=0);const S=d-_+p(this,ut),C=g-b+p(this,ut),T=v-y+p(this,ut),R=d-M+2*p(this,ut),A=g-x+2*p(this,ut),I=v-w+2*p(this,ut),P=d-1+3*p(this,ut),D=g-1+3*p(this,ut),E=v-1+3*p(this,ut),z=c&255,q=l&255,J=u&255,H=p(this,Z)[z+p(this,X)[q+p(this,X)[J]]],nt=p(this,Z)[z+_+p(this,X)[q+b+p(this,X)[J+y]]],Rt=p(this,Z)[z+M+p(this,X)[q+x+p(this,X)[J+w]]],St=p(this,Z)[z+1+p(this,X)[q+1+p(this,X)[J+1]]];let lt=.6-d*d-g*g-v*v;lt<0?s=0:(lt*=lt,s=lt*lt*H.dot3(d,g,v));let Q=.6-S*S-C*C-T*T;Q<0?a=0:(Q*=Q,a=Q*Q*nt.dot3(S,C,T));let K=.6-R*R-A*A-I*I;K<0?o=0:(K*=K,o=K*K*Rt.dot3(R,A,I));let it=.6-P*P-D*D-E*E;return it<0?r=0:(it*=it,r=it*it*St.dot3(P,D,E)),32*(s+a+o+r)}static perlin2(t,e){const i=Math.floor(t),s=Math.floor(e);t=t-i,e=e-s;const a=i&255,o=s&255,r=p(this,Z)[a+p(this,X)[o]].dot2(t,e),n=p(this,Z)[a+p(this,X)[o+1]].dot2(t,e-1),c=p(this,Z)[a+1+p(this,X)[o]].dot2(t-1,e),l=p(this,Z)[a+1+p(this,X)[o+1]].dot2(t-1,e-1),u=j(this,et,Ft).call(this,t);return j(this,et,pt).call(this,j(this,et,pt).call(this,r,c,u),j(this,et,pt).call(this,n,l,u),j(this,et,Ft).call(this,e))}static perlin3(t,e,i){const s=Math.floor(t),a=Math.floor(e),o=Math.floor(i);t=t-s,e=e-a,i=i-o;const r=s&255,n=a&255,c=o&255,l=p(this,Z)[r+p(this,X)[n+p(this,X)[c]]].dot3(t,e,i),u=p(this,Z)[r+p(this,X)[n+p(this,X)[c+1]]].dot3(t,e,i-1),h=p(this,Z)[r+p(this,X)[n+1+p(this,X)[c]]].dot3(t,e-1,i),d=p(this,Z)[r+p(this,X)[n+1+p(this,X)[c+1]]].dot3(t,e-1,i-1),g=p(this,Z)[r+1+p(this,X)[n+p(this,X)[c]]].dot3(t-1,e,i),v=p(this,Z)[r+1+p(this,X)[n+p(this,X)[c+1]]].dot3(t-1,e,i-1),_=p(this,Z)[r+1+p(this,X)[n+1+p(this,X)[c]]].dot3(t-1,e-1,i),b=p(this,Z)[r+1+p(this,X)[n+1+p(this,X)[c+1]]].dot3(t-1,e-1,i-1),y=j(this,et,Ft).call(this,t),M=j(this,et,Ft).call(this,e),x=j(this,et,Ft).call(this,i);return j(this,et,pt).call(this,j(this,et,pt).call(this,j(this,et,pt).call(this,l,g,y),j(this,et,pt).call(this,u,v,y),x),j(this,et,pt).call(this,j(this,et,pt).call(this,h,_,y),j(this,et,pt).call(this,d,b,y),x),M)}};rt=new WeakMap;ge=new WeakMap;ae=new WeakMap;X=new WeakMap;Z=new WeakMap;pe=new WeakMap;Bt=new WeakMap;ve=new WeakMap;ut=new WeakMap;et=new WeakSet;Ft=function(f){return f*f*f*(f*(f*6-15)+10)};pt=function(f,t,e){return(1-e)*f+e*t};Y(U,et);Y(U,rt,class{constructor(f,t,e){this.x=f,this.y=t,this.z=e}dot2(f,t){return this.x*f+this.y*t}dot3(f,t,e){return this.x*f+this.y*t+this.z*e}});Y(U,ge,[new(p(U,rt))(1,1,0),new(p(U,rt))(-1,1,0),new(p(U,rt))(1,-1,0),new(p(U,rt))(-1,-1,0),new(p(U,rt))(1,0,1),new(p(U,rt))(-1,0,1),new(p(U,rt))(1,0,-1),new(p(U,rt))(-1,0,-1),new(p(U,rt))(0,1,1),new(p(U,rt))(0,-1,1),new(p(U,rt))(0,1,-1),new(p(U,rt))(0,-1,-1)]);Y(U,ae,[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180]);Y(U,X,new Array(512));Y(U,Z,new Array(512));Y(U,pe,.5*(Math.sqrt(3)-1));Y(U,Bt,(3-Math.sqrt(3))/6);Y(U,ve,1/3);Y(U,ut,1/6);U.seed(0);let gt=U;function Le(f=800,t=800,e){const{divisions:i=5,zoomType:s="in",color1:a=[255,0,0,255],color2:o=[0,0,255,255],color3:r=[0,0,0,255],backgroundColor:n=[255,255,255,255]}=e||{},c=new Uint8ClampedArray(f*t*4);for(let x=0;x<c.length;x+=4)c[x]=n[0],c[x+1]=n[1],c[x+2]=n[2],c[x+3]=n[3]||255;const l=s==="in"?1:2,u=Math.max(f,t),h=u/l,d=u/l,g=.5*l,v=.5*l,_=(Math.sqrt(5)+1)/2,b=5;let y=[];for(let x=0;x<b*2;x++){const w=wt.fromPolar(1,(2*x-1)*Math.PI/(b*2)),S=wt.fromPolar(1,(2*x+1)*Math.PI/(b*2));x%2===0?y.push(["thin",new wt(0),S,w]):y.push(["thin",new wt(0),w,S])}for(let x=0;x<i;x++){const w=[];for(const[S,C,T,R]of y)if(S==="thin"){const A=C.add(T.subtract(C).scale(1/_));w.push(["thin",R,A,T]),w.push(["thicc",A,R,C])}else{const A=T.add(C.subtract(T).scale(1/_)),I=T.add(R.subtract(T).scale(1/_));w.push(["thicc",I,R,C]),w.push(["thicc",A,I,T]),w.push(["thin",I,A,C])}y=w}function M(x){const w=Math.floor((x.real*h+g*h)*f/u),S=Math.floor((x.imag*d+v*d)*t/u);return{x:w,y:S}}for(const[x,w,S,C]of y){const T=M(w),R=M(S),A=M(C);Ne(c,T,R,A,x==="thin"?a:o,f,t)}if(r&&r[3]>0)for(const[x,w,S,C]of y){const T=M(w),R=M(S),A=M(C);ue(c,T,R,r,f,t),ue(c,R,A,r,f,t),ue(c,A,T,r,f,t)}return c}function Ne(f,t,e,i,s,a,o){t.y>e.y&&([t,e]=[e,t]),t.y>i.y&&([t,i]=[i,t]),e.y>i.y&&([e,i]=[i,e]);const r=s[0],n=s[1],c=s[2],l=s[3]||255;if(e.y===i.y)Me(f,t,e,i,r,n,c,l,a,o);else if(t.y===e.y)Se(f,t,e,i,r,n,c,l,a,o);else{const u={x:Math.floor(t.x+(e.y-t.y)/(i.y-t.y)*(i.x-t.x)),y:e.y};Me(f,t,e,u,r,n,c,l,a,o),Se(f,e,u,i,r,n,c,l,a,o)}}function Me(f,t,e,i,s,a,o,r,n,c){const l=(e.x-t.x)/(e.y-t.y||1),u=(i.x-t.x)/(i.y-t.y||1);let h=t.x,d=t.x;for(let g=t.y;g<=e.y;g++){if(g>=0&&g<c){const v=Math.max(0,Math.min(Math.floor(h),n-1)),_=Math.max(0,Math.min(Math.floor(d),n-1));for(let b=Math.min(v,_);b<=Math.max(v,_);b++){const y=(g*n+b)*4;y>=0&&y<f.length-3&&(f[y]=s,f[y+1]=a,f[y+2]=o,f[y+3]=r)}}h+=l,d+=u}}function Se(f,t,e,i,s,a,o,r,n,c){const l=(i.x-t.x)/(i.y-t.y||1),u=(i.x-e.x)/(i.y-e.y||1);let h=i.x,d=i.x;for(let g=i.y;g>t.y;g--)if(g>=0&&g<c){h-=l,d-=u;const v=Math.max(0,Math.min(Math.floor(h),n-1)),_=Math.max(0,Math.min(Math.floor(d),n-1));for(let b=Math.min(v,_);b<=Math.max(v,_);b++){const y=(g*n+b)*4;y>=0&&y<f.length-3&&(f[y]=s,f[y+1]=a,f[y+2]=o,f[y+3]=r)}}}function ue(f,t,e,i,s,a){const o=i[0],r=i[1],n=i[2],c=i[3]||255;let l=t.x,u=t.y,h=e.x,d=e.y;const g=Math.abs(h-l),v=Math.abs(d-u),_=l<h?1:-1,b=u<d?1:-1;let y=g-v;for(;;){if(l>=0&&l<s&&u>=0&&u<a){const x=(u*s+l)*4;if(x>=0&&x<f.length-3){const w=c/255;f[x]=Math.round(f[x]*(1-w)+o*w),f[x+1]=Math.round(f[x+1]*(1-w)+r*w),f[x+2]=Math.round(f[x+2]*(1-w)+n*w),f[x+3]=255}}if(l===h&&u===d)break;const M=2*y;M>-v&&(y-=v,l+=_),M<g&&(y+=g,u+=b)}}class Ci{static void(t,e,i={}){const{background:s=[255,255,255,255],foreground:a=[0,0,200,255]}=i,o=new Uint8ClampedArray(t*e*4);for(let r=0;r<o.length;r+=4)o[r]=s[0],o[r+1]=s[1],o[r+2]=s[2],o[r+3]=s[3];return o}static solidGrid(t,e,i={}){const{spacing:s=8,background:a=[0,0,0,0],foreground:o=[128,128,128,255]}=i,r=new Uint8ClampedArray(t*e*4);for(let n=0;n<e;n++){const c=n%s===0;for(let l=0;l<t;l++){const h=l%s===0||c,d=(n*t+l)*4,g=h?o:a;r[d]=g[0],r[d+1]=g[1],r[d+2]=g[2],r[d+3]=g[3]}}return r}static checkerboard(t,e,i={}){const{cellSize:s=8,color1:a=[0,0,0,255],color2:o=[255,255,255,255]}=i,r=new Uint8ClampedArray(t*e*4);for(let n=0;n<e;n++){const c=Math.floor(n/s);for(let l=0;l<t;l++){const d=(Math.floor(l/s)+c)%2===0?a:o,g=(n*t+l)*4;r.set(d,g)}}return r}static stripes(t,e,i={}){const{spacing:s=4,thickness:a=1,background:o=[0,0,0,0],foreground:r=[255,255,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let c=0;c<e;c++)for(let l=0;l<t;l++){const h=(l+c)%s<a,d=(c*t+l)*4;n.set(h?r:o,d)}return n}static honeycomb(t,e,i={}){const{radius:s=10,lineWidth:a=1,foreground:o=[255,255,255,255],background:r=[0,0,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let y=0;y<n.length;y+=4)n[y]=r[0],n[y+1]=r[1],n[y+2]=r[2],n[y+3]=r[3];const c=Math.floor(t/2),l=Math.floor(e/2),u=(y,M,x,w,S)=>{const C=Math.abs(y-x),T=Math.abs(M-w),R=S*Math.sqrt(3)/2;return T>R||C>S?!1:S*R*2>=S*T*2+R*C},h=s-a,d=s*Math.sqrt(3),g=Math.max(0,Math.floor(c-s-1)),v=Math.min(t-1,Math.ceil(c+s+1)),_=Math.max(0,Math.floor(l-d/2-1)),b=Math.min(e-1,Math.ceil(l+d/2+1));for(let y=_;y<=b;y++)for(let M=g;M<=v;M++){const x=u(M,y,c,l,s),w=h>0?u(M,y,c,l,h):!1;if(x&&!w){const S=(y*t+M)*4;n[S]=o[0],n[S+1]=o[1],n[S+2]=o[2],n[S+3]=o[3]}}return n}static harlequin(t,e,i={}){const{size:s=20,spacing:a=0,background:o=[255,255,255,255],foreground:r=[0,0,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let g=0;g<n.length;g+=4)n[g]=o[0],n[g+1]=o[1],n[g+2]=o[2],n[g+3]=o[3];const c=s*2,l=s*2,u=c+a,h=l+a,d=(g,v,_,b)=>{const y=Math.abs(g-_)/(c/2),M=Math.abs(v-b)/(l/2);return y+M<=1};for(let g=-1;g<e/h+1;g++)for(let v=-1;v<t/u+1;v++){const _=v*u+u/2,b=g*h+h/2;if(!((g+v)%2===0))continue;const M=Math.max(0,Math.floor(_-c/2)),x=Math.min(t-1,Math.ceil(_+c/2)),w=Math.max(0,Math.floor(b-l/2)),S=Math.min(e-1,Math.ceil(b+l/2));for(let C=w;C<=S;C++)for(let T=M;T<=x;T++)if(d(T,C,_,b)){const R=(C*t+T)*4;n[R]=r[0],n[R+1]=r[1],n[R+2]=r[2],n[R+3]=r[3]}}return n}static circles(t,e,i={}){const{radius:s=10,lineWidth:a=2,spacing:o=5,background:r=[0,0,0,255],foreground:n=[255,255,255,255]}=i,c=new Uint8ClampedArray(t*e*4);for(let h=0;h<c.length;h+=4)c[h]=r[0],c[h+1]=r[1],c[h+2]=r[2],c[h+3]=r[3];const l=s*2+o,u=(h,d,g,v,_)=>{const b=h-g,y=d-v;return b*b+y*y<=_*_};for(let h=0;h<Math.ceil(e/l)+1;h++)for(let d=0;d<Math.ceil(t/l)+1;d++){const g=d*l+s,v=h*l+s;if(g<-s||g>t+s||v<-s||v>e+s)continue;const _=Math.max(0,Math.floor(g-s)),b=Math.min(t-1,Math.ceil(g+s)),y=Math.max(0,Math.floor(v-s)),M=Math.min(e-1,Math.ceil(v+s)),x=s-a;for(let w=y;w<=M;w++)for(let S=_;S<=b;S++){const C=u(S,w,g,v,s),T=u(S,w,g,v,x);if(C&&!T){const R=(w*t+S)*4;c[R]=n[0],c[R+1]=n[1],c[R+2]=n[2],c[R+3]=n[3]}}}return c}static diamonds(t,e,i={}){const{size:s=16,squareSize:a=6,background:o=[255,255,255,255],foreground:r=[0,0,0,255],innerColor:n=[255,255,255,255]}=i,c=new Uint8ClampedArray(t*e*4);for(let d=0;d<c.length;d+=4)c[d]=o[0],c[d+1]=o[1],c[d+2]=o[2],c[d+3]=o[3];const l=s,u=(d,g,v,_,b)=>{const y=Math.abs(d-v),M=Math.abs(g-_);return y+M<=b/2},h=(d,g,v,_,b)=>Math.abs(d-v)<=b/2&&Math.abs(g-_)<=b/2;for(let d=-1;d<e/l+1;d++)for(let g=-1;g<t/l+1;g++){const v=g*l+l/2,_=d*l+l/2;if(v<-l||v>t+l||_<-l||_>e+l)continue;const b=Math.max(0,Math.floor(v-l/2)),y=Math.min(t-1,Math.ceil(v+l/2)),M=Math.max(0,Math.floor(_-l/2)),x=Math.min(e-1,Math.ceil(_+l/2));for(let w=M;w<=x;w++)for(let S=b;S<=y;S++){const C=u(S,w,v,_,l),T=h(S,w,v,_,a);if(C){const R=(w*t+S)*4;T?(c[R]=n[0],c[R+1]=n[1],c[R+2]=n[2],c[R+3]=n[3]):(c[R]=r[0],c[R+1]=r[1],c[R+2]=r[2],c[R+3]=r[3])}}}return c}static cubes(t,e,i={}){const{size:s=10,spacing:a=2,background:o=[0,0,0,255],foreground:r=[255,100,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let l=0;l<n.length;l+=4)n[l]=o[0],n[l+1]=o[1],n[l+2]=o[2],n[l+3]=o[3];const c=s+a;for(let l=0;l<Math.ceil(e/c)+1;l++)for(let u=0;u<Math.ceil(t/c)+1;u++){const h=u*c,d=l*c;if(!(h>=t||d>=e))for(let g=d;g<Math.min(d+s,e);g++)for(let v=h;v<Math.min(h+s,t);v++){const _=(g*t+v)*4;n[_]=r[0],n[_+1]=r[1],n[_+2]=r[2],n[_+3]=r[3]}}return n}static cross(t,e,i={}){const{size:s=8,thickness:a=2,spacing:o=16,background:r=[255,255,255,255],foreground:n=[80,80,80,255]}=i,c=new Uint8ClampedArray(t*e*4);for(let l=0;l<c.length;l+=4)c[l]=r[0],c[l+1]=r[1],c[l+2]=r[2],c[l+3]=r[3];for(let l=0;l<Math.ceil(e/o)+1;l++)for(let u=0;u<Math.ceil(t/o)+1;u++){const h=u*o,d=l*o;if(h<-s||h>t+s||d<-s||d>e+s)continue;const g=h-s/2,v=h+s/2,_=d-a/2,b=d+a/2;for(let S=Math.max(0,Math.floor(_));S<Math.min(e,Math.ceil(b));S++)for(let C=Math.max(0,Math.floor(g));C<Math.min(t,Math.ceil(v));C++){const T=(S*t+C)*4;c[T]=n[0],c[T+1]=n[1],c[T+2]=n[2],c[T+3]=n[3]}const y=h-a/2,M=h+a/2,x=d-s/2,w=d+s/2;for(let S=Math.max(0,Math.floor(x));S<Math.min(e,Math.ceil(w));S++)for(let C=Math.max(0,Math.floor(y));C<Math.min(t,Math.ceil(M));C++){const T=(S*t+C)*4;c[T]=n[0],c[T+1]=n[1],c[T+2]=n[2],c[T+3]=n[3]}}return c}static mesh(t,e,i={}){const{spacing:s=20,lineWidth:a=2,background:o=[255,255,255,0],foreground:r=[0,0,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let c=0;c<n.length;c+=4)n[c]=o[0],n[c+1]=o[1],n[c+2]=o[2],n[c+3]=o[3];for(let c=0;c<e;c++)for(let l=0;l<t;l++){const u=(l+c)%s,h=u<a||u>s-a,d=(l-c+e)%s,g=d<a||d>s-a;if(h||g){const v=(c*t+l)*4;n[v]=r[0],n[v+1]=r[1],n[v+2]=r[2],n[v+3]=r[3]}}return n}static isometric(t,e,i={}){const{cellSize:s=20,lineWidth:a=1,background:o=[0,0,0,0],foreground:r=[0,255,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let u=0;u<n.length;u+=4)n[u]=o[0],n[u+1]=o[1],n[u+2]=o[2],n[u+3]=o[3];const c=s,l=s/2;for(let u=0;u<e;u++)for(let h=0;h<t;h++){const d=h%c,g=u%l,v=g-d/2,_=g+d/2-l,b=Math.abs(v)<a/2,y=Math.abs(_)<a/2;if(b||y){const M=(u*t+h)*4;n[M]=r[0],n[M+1]=r[1],n[M+2]=r[2],n[M+3]=r[3]}}return n}static weave(t,e,i={}){const{tileSize:s=40,lineWidth:a=2,background:o=[255,255,255,255],foreground:r=[0,0,0,255]}=i,n=new Uint8ClampedArray(t*e*4);for(let c=0;c<n.length;c+=4)n[c]=o[0],n[c+1]=o[1],n[c+2]=o[2],n[c+3]=o[3];for(let c=0;c<e;c++)for(let l=0;l<t;l++){const u=l%s,h=c%s,d=Math.abs((h+s/2)%s-s/2)<a/2,g=Math.abs((u+h*2+s*1.5)%s-s/2)<a/2,v=Math.abs((u-h*2+s*1.5)%s-s/2)<a/2;if(d||g||v){const b=(c*t+l)*4;n[b]=r[0],n[b+1]=r[1],n[b+2]=r[2],n[b+3]=r[3]}}return n}static perlinNoise(t,e,i={}){const{background:s=[0,0,0,0],foreground:a=[255,255,255,255],scale:o=.1,octaves:r=4,persistence:n=.5,lacunarity:c=2,seed:l=Math.random()*65536}=i,u=new Uint8ClampedArray(t*e*4);gt.seed(l);for(let h=0;h<e;h++)for(let d=0;d<t;d++){let g=1,v=1,_=0,b=0;for(let w=0;w<r;w++){const S=d*o*v,C=h*o*v,T=gt.perlin2(S,C);_+=T*g,b+=g,g*=n,v*=c}_/=b;const y=(_+1)*.5,M=[Math.floor(s[0]+y*(a[0]-s[0])),Math.floor(s[1]+y*(a[1]-s[1])),Math.floor(s[2]+y*(a[2]-s[2])),Math.floor(s[3]+y*(a[3]-s[3]))],x=(h*t+d)*4;u.set(M,x)}return u}static circularGradient(t,e,i={}){const{innerColor:s=[255,255,255,255],outerColor:a=[0,0,0,255],centerX:o=t/2,centerY:r=e/2,radius:n=Math.min(t,e)/2,fadeExponent:c=1}=i,l=new Uint8ClampedArray(t*e*4);for(let u=0;u<e;u++)for(let h=0;h<t;h++){const d=(u*t+h)*4,g=h-o,v=u-r,_=Math.sqrt(g*g+v*v);let b=Math.min(_/n,1);b=Math.pow(b,c);const y=[Math.floor(s[0]+b*(a[0]-s[0])),Math.floor(s[1]+b*(a[1]-s[1])),Math.floor(s[2]+b*(a[2]-s[2])),Math.floor(s[3]+b*(a[3]-s[3]))];l.set(y,d)}return l}static noiseDisplacement(t,e,i={}){const{gridSpacing:s=16,gridColor:a=[255,255,255,255],background:o=[0,0,0,0],displacementScale:r=8,noiseScale:n=.05,gridThickness:c=1,seed:l=Math.random()*65536}=i,u=new Uint8ClampedArray(t*e*4);gt.seed(l);for(let h=0;h<u.length;h+=4)u.set(o,h);for(let h=0;h<e;h++)for(let d=0;d<t;d++){const g=gt.perlin2(d*n,h*n),v=gt.perlin2((d+31.416)*n,(h+27.182)*n),_=d+g*r,b=h+v*r,y=_%s<c||_%s>s-c,M=b%s<c||b%s>s-c;if(y||M){const x=(h*t+d)*4;u.set(a,x)}}return u}static dotPattern(t,e,i={}){const{dotSize:s=3,spacing:a=12,dotColor:o=[0,0,0,255],background:r=[255,255,255,255],useNoise:n=!1,noiseScale:c=.1,noiseDensity:l=.4,seed:u=Math.random()*65536}=i,h=new Uint8ClampedArray(t*e*4);n&&gt.seed(u);for(let d=0;d<h.length;d+=4)h.set(r,d);if(n){for(let d=0;d<e;d++)for(let g=0;g<t;g++)if((gt.perlin2(g*c,d*c)+1)*.5>l)for(let b=-s;b<=s;b++)for(let y=-s;y<=s;y++){const M=g+y,x=d+b;if(M>=0&&M<t&&x>=0&&x<e&&y*y+b*b<=s*s){const S=(x*t+M)*4;h.set(o,S)}}}else for(let d=Math.floor(a/2);d<e;d+=a)for(let g=Math.floor(a/2);g<t;g+=a)for(let v=-s;v<=s;v++)for(let _=-s;_<=s;_++){const b=g+_,y=d+v;if(b>=0&&b<t&&y>=0&&y<e&&_*_+v*v<=s*s){const x=(y*t+b)*4;h.set(o,x)}}return h}static voronoi(t,e,i={}){const{cellCount:s=20,cellColors:a=null,edgeColor:o=[0,0,0,255],edgeThickness:r=1.5,seed:n=Math.random()*1e3,jitter:c=.5,baseColor:l=null,colorVariation:u=.3}=i,h=new Uint8ClampedArray(t*e*4);gt.seed(n);const d=[],g=[],v=()=>{let w=Math.sin(n*.167+d.length*.423)*1e4;return w-Math.floor(w)},_=Math.sqrt(s),b=t/_,y=e/_,M=w=>{if(l){const[S,C,T,R]=l,A=Math.max(S,C,T)/255,I=Math.min(S,C,T)/255,P=(A+I)/2;let D,E;if(A===I)D=E=0;else{const K=A-I;E=P>.5?K/(2-A-I):K/(A+I),A===S/255?D=(C/255-T/255)/K+(C/255<T/255?6:0):A===C/255?D=(T/255-S/255)/K+2:D=(S/255-C/255)/K+4,D/=6}const z=gt.perlin2(w*.15,0)*u*.3,q=gt.perlin2(0,w*.15)*u,J=gt.perlin2(w*.15,w*.15)*u*.5;D=(D+z)%1,E=Math.min(1,Math.max(0,E*(1+q)));const H=Math.min(.9,Math.max(.1,P*(1+J)));let nt,Rt,St;if(E===0)nt=Rt=St=H;else{const K=(It,Ht,mt)=>(mt<0&&(mt+=1),mt>1&&(mt-=1),mt<.16666666666666666?It+(Ht-It)*6*mt:mt<.5?Ht:mt<.6666666666666666?It+(Ht-It)*(.6666666666666666-mt)*6:It),it=H<.5?H*(1+E):H+E-H*E,Yt=2*H-it;nt=K(Yt,it,D+1/3),Rt=K(Yt,it,D),St=K(Yt,it,D-1/3)}const lt=.05,Q=()=>(v()*2-1)*lt;return[Math.min(255,Math.max(0,Math.floor(nt*255*(1+Q())))),Math.min(255,Math.max(0,Math.floor(Rt*255*(1+Q())))),Math.min(255,Math.max(0,Math.floor(St*255*(1+Q())))),R]}else{const S=w*.618033988749895%1;let C,T,R;const A=S*6,I=Math.floor(A),P=A-I,D=.5,E=.5*(1-P),z=.5*(1-(1-P));switch(I%6){case 0:C=.5,T=z,R=D;break;case 1:C=E,T=.5,R=D;break;case 2:C=D,T=.5,R=z;break;case 3:C=D,T=E,R=.5;break;case 4:C=z,T=D,R=.5;break;case 5:C=.5,T=D,R=E;break}return[Math.floor(C*255+50+v()*100),Math.floor(T*255+50+v()*100),Math.floor(R*255+50+v()*100),255]}};for(let w=0;w<_;w++)for(let S=0;S<_&&!(d.length>=s);S++){const C=S*b+b/2,T=w*y+y/2,R=(v()*2-1)*c*b,A=(v()*2-1)*c*y;d.push({x:Math.floor(C+R),y:Math.floor(T+A)}),a&&d.length-1<a.length?g.push(a[d.length-1]):g.push(M(d.length-1))}const x=(w,S,C,T)=>{let R=Math.abs(w-C),A=Math.abs(S-T);R=Math.min(R,t-R),A=Math.min(A,e-A);const I=Math.sqrt(R*R+A*A),P=R+A;return I*.8+P*.2};for(let w=0;w<e;w++)for(let S=0;S<t;S++){const C=(w*t+S)*4;let T=1/0,R=1/0,A=0;for(let D=0;D<d.length;D++){const E=x(S,w,d[D].x,d[D].y);E<T?(R=T,T=E,A=D):E<R&&(R=E)}for(let D=0;D<d.length;D++)for(let E=-1;E<=1;E++)for(let z=-1;z<=1;z++){if(E===0&&z===0)continue;const q=d[D].x+E*t,J=d[D].y+z*e,H=Math.sqrt(Math.pow(S-q,2)+Math.pow(w-J,2));H<T?(R=T,T=H,A=D):H<R&&(R=H)}R-T<r?h.set(o,C):h.set(g[A],C)}return h}static penrose(t,e,i={}){return Le(t,e,i)}}class Wt{static lerp(t,e,i){return t+(e-t)*i}static linear(t){return t}static smoothstep(t){return t*t*(3-2*t)}static smootherstep(t){return t*t*t*(t*(t*6-15)+10)}static easeInQuad(t){return t*t}static easeOutQuad(t){return t*(2-t)}static easeInOutQuad(t){return t<.5?2*t*t:-1+(4-2*t)*t}static easeInCubic(t){return t*t*t}static easeOutCubic(t){return--t*t*t+1}static easeInOutCubic(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1}static easeInQuart(t){return t*t*t*t}static easeOutQuart(t){return 1- --t*t*t*t}static easeInOutQuart(t){return t<.5?8*t*t*t*t:1-8*--t*t*t*t}static easeInSine(t){return 1-Math.cos(t*Math.PI/2)}static easeOutSine(t){return Math.sin(t*Math.PI/2)}static easeInOutSine(t){return-(Math.cos(Math.PI*t)-1)/2}static easeInExpo(t){return t===0?0:Math.pow(2,10*(t-1))}static easeOutExpo(t){return t===1?1:1-Math.pow(2,-10*t)}static easeInOutExpo(t){return t===0||t===1?t:t<.5?.5*Math.pow(2,20*t-10):.5*(2-Math.pow(2,-20*t+10))}static easeInCirc(t){return 1-Math.sqrt(1-t*t)}static easeOutCirc(t){return Math.sqrt(1- --t*t)}static easeInOutCirc(t){return t<.5?.5*(1-Math.sqrt(1-4*t*t)):.5*(Math.sqrt(-(2*t-3)*(2*t-1))+1)}static easeInElastic(t,e=1,i=.3){if(t===0||t===1)return t;const s=i/(2*Math.PI)*Math.asin(1/e);return-(e*Math.pow(2,10*(t-1))*Math.sin((t-1-s)*(2*Math.PI)/i))}static easeOutElastic(t,e=1,i=.3){if(t===0||t===1)return t;const s=i/(2*Math.PI)*Math.asin(1/e);return e*Math.pow(2,-10*t)*Math.sin((t-s)*(2*Math.PI)/i)+1}static easeInOutElastic(t,e=1,i=.3){if(t===0||t===1)return t;const s=i/(2*Math.PI)*Math.asin(1/e);return t<.5?-.5*(e*Math.pow(2,10*(2*t-1))*Math.sin((2*t-1-s)*(2*Math.PI)/i)):e*Math.pow(2,-10*(2*t-1))*Math.sin((2*t-1-s)*(2*Math.PI)/i)*.5+1}static easeInBack(t,e=1.70158){return t*t*((e+1)*t-e)}static easeOutBack(t,e=1.70158){return--t*t*((e+1)*t+e)+1}static easeInOutBack(t,e=1.70158){const i=e*1.525;return t<.5?.5*(2*t)*(2*t)*((i+1)*2*t-i):.5*((2*t-2)*(2*t-2)*((i+1)*(2*t-2)+i)+2)}static easeOutBounce(t){return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}static easeInBounce(t){return 1-Wt.easeOutBounce(1-t)}static easeInOutBounce(t){return t<.5?Wt.easeInBounce(t*2)*.5:Wt.easeOutBounce(t*2-1)*.5+.5}}function Ce(f,t,e){const i=Math.max(0,Math.min(1,(e-f)/(t-f)));return Wt.smoothstep(i)}function Ti(f,t,e){const{heatZone:i,coolZone:s,rate:a,heatMultiplier:o=1.5,coolMultiplier:r=1.5,middleMultiplier:n=.05,transitionWidth:c=.1}=e,l=Ce(i-c,i+c*.5,f),u=1-Ce(s-c*.5,s+c,f),h=1-l-u;let d=0;return l>0&&(d+=(1-t)*a*o*l),u>0&&(d+=(0-t)*a*r*u),h>0&&(d+=(f-t)*a*n*h),Math.max(0,Math.min(1,t+d))}function Ri(f,t,e){return(f-t)*e}function Ai(f,t,e){const i=f/t;return e*i}function ki(f,t,e,i,s){return e>=i?0:(t-f)*s}const Mt=class O{static disableAll(){O.enabledClasses=new Set,O.globalLevel=0}static disable(){O.enabled=!1}static enable(){O.enabled=!0}static setLevel(t){O.globalLevel=t}static enableFor(t){O.enabledClasses.add(t)}static disableFor(t){O.enabledClasses.delete(t)}static setOutput(t){O.output=t}constructor(t){this.className=t}static getLogger(t){return O.loggerz[t]||(O.loggerz[t]=new O(t)),O.loggerz[t]}_log(t,e,...i){O.enabled&&(O.globalLevel>=t||O.enabledClasses.has(this.className))&&O.output[e](`[${this.className}]`,...i)}log(...t){this._log(O.INFO,"log",...t)}warn(...t){this._log(O.WARN,"warn",...t)}error(...t){this._log(O.ERROR,"error",...t)}debug(...t){this._log(O.DEBUG,"log",...t)}table(...t){this._log(O.INFO,"table",...t)}groupCollapsed(t){O.enabled&&O.output.groupCollapsed(`[${this.className}] ${t}`)}groupEnd(){O.enabled&&O.output.groupEnd()}time(t){O.enabled&&O.output.time(`[${this.className}] ${t}`)}timeEnd(t){O.enabled&&O.output.timeEnd(`[${this.className}] ${t}`)}clear(){O.output.clear()}};k(Mt,"ERROR",1);k(Mt,"WARN",2);k(Mt,"INFO",3);k(Mt,"DEBUG",4);k(Mt,"globalLevel",Mt.ERROR);k(Mt,"enabledClasses",new Set);k(Mt,"output",console);k(Mt,"enabled",!0);k(Mt,"loggerz",[]);let bt=Mt;class ke{constructor(t={}){this.name=t.name||this.constructor.name,this._logger=this.getLogger(t)}get logger(){return this._logger==null?this.getLogger():this._logger}trace(t="render"){this.logger.log(this.name==null?this.constructor.name:this.name,t,"x",this.x,"y",this.y,"w",this.width,"h",this.height,"opacity",this._opacity,"visible",this._visible,"active",this._active,"debug",this.debug)}getLogger(t){return bt.getLogger(t.name||this.constructor.name)}}const We=class Ut{static getInstance(){return Ut.instance||(Ut.instance=new Ut),Ut.instance}constructor(){this.createTab()}createTab(){this.tab=document.createElement("div"),Object.assign(this.tab.style,{position:"fixed",bottom:"0",left:"0",right:"0",height:"30px",backgroundColor:"#333",color:"#fff",padding:"5px",cursor:"pointer",fontFamily:"monospace",zIndex:"10000",display:"flex",justifyContent:"space-between",alignItems:"center"}),this.tab.innerText="Console";const t=document.createElement("div"),e=(i,s)=>{const a=document.createElement("button");return a.innerText=i,Object.assign(a.style,{marginLeft:"5px",padding:"2px 5px",fontFamily:"monospace",cursor:"pointer"}),a.onclick=s,a};this.paused=!1,this.scrollLock=!0,t.appendChild(e("Clear",()=>this.consoleArea.value="")),t.appendChild(e("Pause",()=>this.paused=!this.paused)),t.appendChild(e("Scroll Lock",()=>this.scrollLock=!this.scrollLock)),this.tab.appendChild(t),document.body.appendChild(this.tab),this.consoleArea=document.createElement("textarea"),Object.assign(this.consoleArea.style,{position:"fixed",bottom:"30px",left:"0",right:"0",height:"200px",display:"none",backgroundColor:"#111",color:"#0f0",fontFamily:"monospace",zIndex:"9999",padding:"10px",resize:"none"}),this.consoleArea.readOnly=!0,document.body.appendChild(this.consoleArea),this.tab.onclick=i=>{i.target===this.tab&&(this.consoleArea.style.display=this.consoleArea.style.display==="none"?"block":"none")}}appendMessage(t,e,...i){if(this.paused)return;const s=`[${t.toUpperCase()}] ${e} ${i.join(" ")}
`;this.consoleArea.value+=s,this.scrollLock&&(this.consoleArea.scrollTop=this.consoleArea.scrollHeight)}log(t,...e){this.appendMessage("log",t,...e)}warn(t,...e){this.appendMessage("warn",t,...e)}error(t,...e){this.appendMessage("error",t,...e)}table(t){const e=JSON.stringify(t,null,2);this.appendMessage("table",e)}groupCollapsed(t){this.appendMessage("group",`Group Start: ${t}`)}groupEnd(){this.appendMessage("group","Group End")}time(t){this[`time_${t}`]=performance.now()}timeEnd(t){const e=performance.now(),i=this[`time_${t}`],s=(e-i).toFixed(2);this.appendMessage("time",`${t}: ${s} ms`)}};k(We,"instance");const be=class ct{static dropShadow(t,e,i=0,s=0){m.ctx.shadowColor=t,m.ctx.shadowBlur=e,m.ctx.shadowOffsetX=i,m.ctx.shadowOffsetY=s}static clearShadow(){m.ctx.shadowColor="rgba(0, 0, 0, 0)",m.ctx.shadowBlur=0,m.ctx.shadowOffsetX=0,m.ctx.shadowOffsetY=0}static setAlpha(t){m.ctx.globalAlpha=t}static setBlendMode(t){m.ctx.globalCompositeOperation=t}static clipRect(t,e,i,s){m.ctx.beginPath(),m.ctx.rect(t,e,i,s),m.ctx.clip()}static clipCircle(t,e,i){m.ctx.beginPath(),m.shapes.arc(t,e,i,0,Math.PI*2),m.ctx.clip()}static blurRegion(t,e,i,s,a){const o=m.ctx.filter;m.ctx.filter=`blur(${a}px)`;const r=m.ctx.getImageData(t,e,i,s);m.ctx.putImageData(r,t,e),m.ctx.filter=o}static createGlow(t,e,i={}){const s="glow-"+Math.random().toString(36).substr(2,9),o={...{pulseSpeed:0,pulseMin:e*.5,pulseMax:e*1.5,colorShift:0},...i},r={id:s,type:"glow",active:!0,time:0,color:t,blur:e,options:o,update(n){return Object.assign(this,n),this},stop(){return this.active=!1,ct._activeEffects.delete(this.id),this},apply(){if(!this.active)return;let n=this.blur,c=this.color;if(this.options.pulseSpeed>0){const l=Math.sin(this.time*this.options.pulseSpeed)*.5+.5;n=this.options.pulseMin+l*(this.options.pulseMax-this.options.pulseMin)}return this.options.colorShift>0&&(c=c.replace("hue",this.time*this.options.colorShift%360)),m.ctx.shadowColor=c,m.ctx.shadowBlur=n,m.ctx.shadowOffsetX=0,m.ctx.shadowOffsetY=0,this.time+=1/60,this}};return ct._activeEffects.set(s,r),ct._startAnimationLoop(),r}static _startAnimationLoop(){if(ct._animationId!==null)return;const t=()=>{if(ct._activeEffects.forEach(e=>{e.active&&e.apply()}),ct._activeEffects.size===0){cancelAnimationFrame(ct._animationId),ct._animationId=null;return}ct._animationId=requestAnimationFrame(t)};ct._animationId=requestAnimationFrame(t)}static clearAllEffects(){ct._activeEffects.forEach(t=>t.stop()),ct._activeEffects.clear(),m.ctx.shadowColor="rgba(0, 0, 0, 0)",m.ctx.shadowBlur=0,m.ctx.shadowOffsetX=0,m.ctx.shadowOffsetY=0,m.ctx.filter="none",m.ctx.globalAlpha=1,m.ctx.globalCompositeOperation="source-over"}};k(be,"_activeEffects",new Map);k(be,"_animationId",null);let Ge=be;class He{static draw(t,e=0,i=0,{width:s,height:a,crop:o=null,anchor:r="top‑left",rotation:n=0,scaleX:c=1,scaleY:l=1,flipX:u=!1,flipY:h=!1,alpha:d=1,smoothing:g=!0}={}){const v=m.ctx;if(!v||!t)return;const _=s??(o?o.sw:t.width??t.videoWidth),b=a??(o?o.sh:t.height??t.videoHeight),y={left:0,center:.5,right:1}[r.split("-").pop()]??0,M={top:0,center:.5,bottom:1}[r.split("-")[0]]??0,x=-_*y,w=-b*M;if(v.save(),v.imageSmoothingEnabled=g,v.globalAlpha*=d,v.translate(e,i),n&&v.rotate(n),(u||h)&&v.scale(u?-1:1,h?-1:1),v.scale(c,l),o){const{sx:S,sy:C,sw:T,sh:R}=o;v.drawImage(t,S,C,T,R,x,w,_,b)}else v.drawImage(t,x,w,_,b);v.restore()}static blit(t,e,i,s,a){this.draw(t,e,i,{width:s,height:a})}static createPattern(t,e="repeat"){return m.ctx.createPattern(t,e)}static fillPattern(t,e,i,s,a){const o=m.ctx;o.save(),o.fillStyle=t,o.fillRect(e,i,s,a),o.restore()}static createImageData(t,e){return m.ctx.createImageData(t,e)}static cloneImageData(t){return new ImageData(new Uint8ClampedArray(t.data),t.width,t.height)}static getImageData(t,e,i,s){return m.ctx.getImageData(t,e,i,s)}static putImageData(t,e,i,s=0,a=0,o=t.width,r=t.height){m.ctx.putImageData(t,e,i,s,a,o,r)}static mapPixels(t,e){const i=t.data;for(let s=0;s<i.length;s+=4){const a=s>>2,o=e(i[s],i[s+1],i[s+2],i[s+3],a);o&&([i[s],i[s+1],i[s+2],i[s+3]]=o)}return t}static setPixel(t,e,i,s,a,o,r=255){const n=(i*t.width+e)*4,c=t.data;c[n]=s,c[n+1]=a,c[n+2]=o,c[n+3]=r}static async toBitmap({type:t="image/png",quality:e=.92}={}){const s=await m.ctx.canvas.convertToBlob({type:t,quality:e});return createImageBitmap(s)}static async createBitmap(t){return createImageBitmap(t)}static toImageData(t,e,i){if(t.length!==e*i*4)throw new Error("Invalid RGBA array size for given dimensions");return new ImageData(t,e,i)}static async createImageBitmapFromPixels(t,e,i){const s=this.toImageData(t,e,i);return await createImageBitmap(s)}static createPatternFromImageData(t,e="repeat"){const i=document.createElement("canvas");i.width=t.width,i.height=t.height;const s=i.getContext("2d");return s.putImageData(t,0,0),s.createPattern(i,e)}static createPatternFromPixels(t,e,i,s="repeat"){const a=this.toImageData(t,e,i);return this.createPatternFromImageData(a,s)}}class Ue{static path(t,e,i,s=1){const a=m.ctx;a.beginPath();for(const o of t){const[r,...n]=o;r==="M"?a.moveTo(...n):r==="L"?a.lineTo(...n):r==="C"?a.bezierCurveTo(...n):r==="Q"?a.quadraticCurveTo(...n):r==="Z"&&a.closePath()}e&&(a.fillStyle=e,m.colors.fill(e)),i&&(a.strokeStyle=i,a.lineWidth=s,m.colors.stroke())}static line(t,e,i,s,a,o){m.ctx.beginPath(),m.ctx.moveTo(t,e),m.ctx.lineTo(i,s),m.colors.stroke(a,o)}static beginPath(){m.ctx.beginPath()}static closePath(){m.ctx.closePath()}static moveTo(t,e){m.ctx.moveTo(t,e)}static lineTo(t,e){m.ctx.lineTo(t,e)}static bezierCurveTo(t,e,i,s,a,o){m.ctx.bezierCurveTo(t,e,i,s,a,o)}static dashedLine(t,e,i,s,a,o,r){m.ctx.beginPath(),o&&(m.ctx.strokeStyle=o),r!==void 0&&(m.ctx.lineWidth=r),m.ctx.setLineDash(a),m.ctx.moveTo(t,e),m.ctx.lineTo(i,s),m.colors.stroke(),m.ctx.setLineDash([])}static dottedLine(t,e,i,s,a=2,o=5,r){return m.lines.dashedLine(t,e,i,s,[a,o],r,a)}static setLineDash(t){m.ctx.setLineDash(t)}static resetLineDash(){m.ctx.setLineDash([])}static setLineWidth(t){m.ctx.lineWidth=t}static quadraticCurve(t,e,i,s,a,o,r,n){m.ctx.beginPath(),m.ctx.moveTo(t,e),m.ctx.quadraticCurveTo(i,s,a,o),r&&(m.ctx.strokeStyle=r),n!==void 0&&(m.ctx.lineWidth=n),m.colors.stroke()}}class De{static pushOpacity(t){const i=this._opacityStack[this._opacityStack.length-1]*t;this._opacityStack.push(i),m.logger.log("NEXT OPACITY WILL BE",i),m.effects.setAlpha(i)}static popOpacity(){if(this._opacityStack.length>1){this._opacityStack.pop();const t=this._opacityStack[this._opacityStack.length-1];m.logger.log("NEXT OPACITY WILL BE",t),m.effects.setAlpha(t)}}static _clone(){this._opacityStack=[...this._opacityStack]}static saveOpacityState(){this._opacityStateBackup=[...this._opacityStack]}static restoreOpacityState(){this._opacityStateBackup&&(this._opacityStack=this._opacityStateBackup,delete this._opacityStateBackup)}}k(De,"_opacityStack",[1]);class qe{static rect(t,e,i,s,a){const o=m.ctx.fillStyle;m.colors.fill(a),m.ctx.fillRect(t,e,i,s),m.ctx.fillStyle=o}static outlineRect(t,e,i,s,a,o=1){const r=m.ctx.strokeStyle,n=m.ctx.lineWidth;m.ctx.strokeStyle=a,m.ctx.lineWidth=o,m.ctx.strokeRect(t,e,i,s),m.ctx.strokeStyle=r,m.ctx.lineWidth=n}static roundRect(t,e,i,s,a=0,o,r,n){let c;typeof a=="number"?c=[a,a,a,a]:Array.isArray(a)?c=a.length===4?a:[a[0]||0,a[1]||a[0]||0,a[2]||a[0]||0,a[3]||a[1]||a[0]||0]:c=[0,0,0,0];const[l,u,h,d]=c,g=t+i,v=e+s;m.lines.beginPath(),m.lines.moveTo(t+l,e),m.lines.lineTo(g-u,e),this.arc(g-u,e+u,u,-Math.PI/2,0),m.lines.lineTo(g,v-h),this.arc(g-h,v-h,h,0,Math.PI/2),m.lines.lineTo(t+d,v),this.arc(t+d,v-d,d,Math.PI/2,Math.PI),m.lines.lineTo(t,e+l),this.arc(t+l,e+l,l,Math.PI,-Math.PI/2),m.lines.closePath(),o&&(m.fillStyle=o,m.colors.fill(o)),r&&m.colors.stroke(r,n)}static fillRoundRect(t,e,i,s,a=0,o){this.roundRect(t,e,i,s,a,o,null)}static strokeRoundRect(t,e,i,s,a=0,o,r){this.roundRect(t,e,i,s,a,null,o,r)}static fillCircle(t,e,i,s){m.logger.log("PainterShapes.fillCircle",t,e,i,s),m.lines.beginPath(),this.arc(t,e,i,0,Math.PI*2),m.colors.fill(s)}static arc(t,e,i,s,a,o){m.ctx.arc(t,e,i,s,a,o)}static strokeCircle(t,e,i,s,a){m.lines.beginPath(),this.arc(t,e,i,0,Math.PI*2),m.colors.stroke(s,a)}static fillEllipse(t,e,i,s,a=0,o){m.lines.beginPath(),this.ellipse(t,e,i,s,a,0,Math.PI*2),o&&(m.fillStyle=o),m.colors.fill(o)}static strokeEllipse(t,e,i,s,a=0,o,r){m.lines.beginPath(),this.ellipse(t,e,i,s,a,0,Math.PI*2),o&&(m.strokeStyle=o),r!==void 0&&(m.lineWidth=r),m.colors.stroke(o,r)}static ellipse(t,e,i,s,a,o,r,n){m.ctx.ellipse(t,e,i,s,a,o,r,n)}static polygon(t,e,i,s){if(!(t.length<2)){m.lines.beginPath(),m.lines.moveTo(t[0].x,t[0].y);for(let a=1;a<t.length;a++)m.lines.lineTo(t[a].x,t[a].y);m.lines.closePath(),e&&m.colors.fill(e),i&&m.colors.stroke(i,s)}}}class Ze{static font(){return m.ctx.font}static setFont(t){m.ctx.font=t}static setTextAlign(t){m.ctx.textAlign=t}static setTextBaseline(t){m.ctx.textBaseline=t}static fillText(t,e,i,s,a){s&&(m.ctx.fillStyle=s),a&&(m.ctx.font=a),m.ctx.fillText(t,e,i)}static strokeText(t,e,i,s,a,o){s&&(m.ctx.strokeStyle=s),a!==void 0&&(m.ctx.lineWidth=a),o&&(m.ctx.font=o),m.ctx.strokeText(t,e,i)}static measureTextDimensions(t,e,i="start",s="alphabetic"){e&&(m.ctx.font=e);const a=m.ctx.measureText(t),o=a.width,r=a.actualBoundingBoxAscent+a.actualBoundingBoxDescent;let n=0;return s==="middle"&&(n=-1.5),{width:o,height:r,verticalAdjustment:n}}static measureTextWidth(t,e){return e&&(m.ctx.font=e),m.ctx.measureText(t).width}static outlinedText(t,e,i,s,a,o,r){r&&(m.ctx.font=r),m.ctx.strokeStyle=a,m.ctx.lineWidth=o,m.ctx.strokeText(t,e,i),m.ctx.fillStyle=s,m.ctx.fillText(t,e,i)}static wrappedText(t,e,i,s,a,o,r){o&&(m.ctx.fillStyle=o),r&&(m.ctx.font=r);const n=t.split(" ");let c="",l="",u=1;for(let h=0;h<n.length;h++)l=c+n[h]+" ",m.ctx.measureText(l).width>s&&h>0?(m.ctx.fillText(c,e,i),c=n[h]+" ",i+=a,u++):c=l;return m.ctx.fillText(c,e,i),u*a}static textOnPath(t,e,i,s,a=!1){if(e.length<2)return;i&&(m.ctx.fillStyle=i),s&&(m.ctx.font=s);const o=t.split(""),r=o.map(h=>m.ctx.measureText(h).width);a&&(o.reverse(),r.reverse(),e.reverse());let n=0;for(let h=1;h<e.length;h++){const d=e[h].x-e[h-1].x,g=e[h].y-e[h-1].y;n+=Math.sqrt(d*d+g*g)}const c=r.reduce((h,d)=>h+d,0);let l=(n-c)/2;l<0&&(l=0);let u=l;for(let h=0;h<o.length;h++){const d=r[h],{x:g,y:v,angle:_}=getPositionOnPath(e,u);m.ctx.save(),m.ctx.translate(g,v),m.ctx.rotate(_),m.ctx.fillText(o[h],0,0),m.ctx.restore(),u+=d}}static getPositionOnPath(t,e){let i=0;for(let r=1;r<t.length;r++){const n=t[r-1],c=t[r],l=c.x-n.x,u=c.y-n.y,h=Math.sqrt(l*l+u*u);if(i+h>=e){const d=(e-i)/h,g=n.x+l*d,v=n.y+u*d,_=Math.atan2(u,l);return{x:g,y:v,angle:_}}i+=h}const s=t[t.length-1],a=t[t.length-2],o=Math.atan2(s.y-a.y,s.x-a.x);return{x:s.x,y:s.y,angle:o}}}const Tt=class ht{static get colors(){return j(this,At,Dt).call(this,"colors",p(this,qt)),p(this,qt)}static get effects(){return j(this,At,Dt).call(this,"effects",p(this,Zt)),p(this,Zt)}static get img(){return j(this,At,Dt).call(this,"img",p(this,Vt)),p(this,Vt)}static get lines(){return j(this,At,Dt).call(this,"lines",p(this,$t)),p(this,$t)}static get opacity(){return j(this,At,Dt).call(this,"opacity",p(this,jt)),p(this,jt)}static get shapes(){return j(this,At,Dt).call(this,"shapes",p(this,Kt)),p(this,Kt)}static get text(){return j(this,At,Dt).call(this,"text",p(this,Jt)),p(this,Jt)}static set ctx(t){this._ctx=t}static get ctx(){if(!this._ctx)throw new Error("Cannot access Painter.ctx before initialization!");return this._ctx}static init(t){this._ctx=t,this.saveStack=[],N(this,qt,Ve),N(this,Zt,Ge),N(this,Vt,He),N(this,$t,Ue),N(this,jt,De),N(this,Kt,qe),N(this,Jt,Ze),ht.logger=bt.getLogger("Painter"),ht.saveStack=[]}static setContext(t){this._ctx=t}static save(){const e=(new Error().stack.split(`
`)[2]||"").match(/at\s+(\w+)\.(\w+)/),i=e?`${e[1]}.${e[2]}`:"unknown";this.saveStack.push(i),this.logger.log(`Painter.save() by: ${i}`),this.ctx.save(),ht.opacity.saveOpacityState()}static restore(){if(this.saveStack.length===0){console.error("PAINTER ERROR: restore() without matching save()!");return}const t=this.saveStack.pop();this.logger.log(`Painter.restore() balancing save from: ${t}`),this.ctx.restore(),ht.opacity.restoreOpacityState()}static translateTo(t,e){(isNaN(t)||t===void 0)&&(t=0),(isNaN(e)||e===void 0)&&(e=0),this.logger.log("moveTo",t,e),this.ctx.translate(t,e)}static resetPosition(){this.logger.log("resetPosition");const t=this.ctx.getTransform();this.ctx.setTransform(t.a,t.b,t.c,t.d,0,0)}static withPosition(t,e,i){this.logger.log("withPosition",t,e),this.save(),this.translateTo(t,e),i(),this.restore()}static clear(t=0,e=0,i=ht.ctx.canvas.width,s=ht.ctx.canvas.height){ht.ctx.clearRect(t,e,i,s)}static translate(t,e){ht.ctx.translate(t,e)}static rotate(t){ht.logger.log("Painter.rotate",t),ht.ctx.rotate(t)}static scale(t,e){ht.logger.log("Painter.scale",t,e),ht.ctx.scale(t,e)}static useCtx(t,e={}){const i=this.ctx,{saveState:s=!1}=e;s&&this.save(),i.beginPath(),t(i),i.beginPath(),s&&this.restore()}};qt=new WeakMap;Zt=new WeakMap;Vt=new WeakMap;$t=new WeakMap;jt=new WeakMap;Kt=new WeakMap;Jt=new WeakMap;At=new WeakSet;Dt=function(f,t){if(!t)throw new Error(`Painter.${f} is not initialized. Call Painter.init(ctx) first.`)};Y(Tt,At);Y(Tt,qt,null);Y(Tt,Zt,null);Y(Tt,Vt,null);Y(Tt,$t,null);Y(Tt,jt,null);Y(Tt,Kt,null);Y(Tt,Jt,null);k(Tt,"logger");let m=Tt;class Ve{static fill(t){m.logger.log("PainterColors.fill - before:",m.ctx.fillStyle,"setting to:",t),m.ctx.fillStyle,m.ctx.fillStyle=t,m.ctx.fill(),m.logger.log("PainterColors.fill - after:",m.ctx.fillStyle)}static strokeOptions(t){t.color&&(m.ctx.strokeStyle=t.color),t.lineWidth!==void 0&&(m.ctx.lineWidth=t.lineWidth),t.lineCap&&(m.ctx.lineCap=t.lineCap),t.lineJoin&&(m.ctx.lineJoin=t.lineJoin),t.strokeStyle&&(m.ctx.strokeStyle=t.strokeStyle)}static stroke(t,e){t&&(m.ctx.strokeStyle=t),e!==void 0&&(m.ctx.lineWidth=e),m.ctx.stroke()}static setFillColor(t){m.ctx.fillStyle=t}static setStrokeColor(t){m.ctx.strokeStyle=t}static randomColorRGB(){const t=Math.floor(Math.random()*360),e=70+Math.floor(Math.random()*30),i=50+Math.floor(Math.random()*20);return m.colors.hslToRgb(t,e,i)}static randomColorRGBA(t=255){const[e,i,s]=this.randomColorRGB();return[e,i,s,t]}static randomColorHSL(){return`hsl(${Math.random()*360}, 100%, 50%)`}static randomColorHSL_RGBA(t=255){const e=Math.random()*360,i=60+Math.random()*40,s=40+Math.random()*40,[a,o,r]=m.colors.hslToRgb(e,i,s);return[a,o,r,t]}static randomColorHEX(){return"#"+(Math.random()*1048575*1e6).toString(16).slice(0,6)}static parseColorString(t){if(t=t.trim().toLowerCase(),t.startsWith("hsl")){const e=t.replace(/hsla?\(|\)/g,""),[i,s,a]=e.split(",").map(c=>c.trim()),o=parseFloat(i),r=parseFloat(s)/100,n=parseFloat(a)/100;return m.colors.hslToRgb(o,r,n)}if(t.startsWith("#"))return hexToRgb(t);if(t.startsWith("rgb")){const e=t.replace(/rgba?\(|\)/g,""),[i,s,a]=e.split(",").map(o=>parseInt(o.trim()));return[i,s,a]}return[0,0,0]}static rgbArrayToCSS([t,e,i]){return`rgb(${Math.round(t)}, ${Math.round(e)}, ${Math.round(i)})`}static hslToRgb(t,e,i){e/=100,i/=100;const s=r=>(r+t/30)%12,a=e*Math.min(i,1-i),o=r=>i-a*Math.max(-1,Math.min(s(r)-3,Math.min(9-s(r),1)));return[Math.round(o(0)*255),Math.round(o(8)*255),Math.round(o(4)*255)]}static rgbToHsl(t,e,i){t/=255,e/=255,i/=255;const s=Math.max(t,e,i),a=Math.min(t,e,i),o=s-a;let r=0,n=0,c=(s+a)/2;if(o!==0)switch(n=o/(1-Math.abs(2*c-1)),s){case t:r=60*(((e-i)/o+6)%6);break;case e:r=60*((i-t)/o+2);break;case i:r=60*((t-e)/o+4);break}return[r%360,n,c]}static hexToRgb(t){const e=t.replace("#",""),i=parseInt(e.substring(0,2),16),s=parseInt(e.substring(2,4),16),a=parseInt(e.substring(4,6),16);return[i,s,a]}static linearGradient(t,e,i,s,a){const o=m.ctx.createLinearGradient(t,e,i,s);for(const r of a)o.addColorStop(r.offset,r.color);return o}static radialGradient(t,e,i,s,a,o,r){const n=m.ctx.createRadialGradient(t,e,i,s,a,o);for(const c of r)n.addColorStop(c.offset,c.color);return n}static verticalGradient(t,e,i,s,a){return m.colors.linearGradient(t,e,t,e+s,a)}static horizontalGradient(t,e,i,s,a){return m.colors.linearGradient(t,e,t+i,e,a)}static conicGradient(t,e,i,s){if(typeof m.ctx.createConicGradient=="function"){const a=m.ctx.createConicGradient(i,t,e);for(const o of s)a.addColorStop(o.offset,o.color);return a}return null}static rgba(t,e,i,s=1){return`rgba(${Math.round(t)}, ${Math.round(e)}, ${Math.round(i)}, ${s})`}static hsl(t,e,i){return`hsl(${t}, ${e}%, ${i}%)`}static hsla(t,e,i,s){return`hsla(${t}, ${e}%, ${i}%, ${s})`}}class $e extends ke{constructor(t={}){super(t),this._x=typeof t.x=="number"?t.x:0,this._y=typeof t.y=="number"?t.y:0,this._width=typeof t.width=="number"?t.width:0,this._height=typeof t.height=="number"?t.height:0,this.logger.log("Euclidian",this._x,this._y,this._width,this._height)}get x(){return this._x}set x(t){this.validateProp(t,"x"),this._x=t}get y(){return this._y}set y(t){this.validateProp(t,"y"),this._y=t}get width(){return this._width}set width(t){this.validateProp(t,"width"),this._width=Math.max(0,t)}get height(){return this._height}set height(t){this.validateProp(t,"height"),this._height=Math.max(0,t)}get debug(){return this._debug}set debug(t){this.validateProp(t,"debug"),this._debug=!!t}get debugColor(){return this._debugColor}set debugColor(t){this.validateProp(t,"debugColor"),this._debugColor=t}validateProp(t,e){if(t==null)throw new Error("Invalid property value: "+e+" "+t)}}class je extends $e{constructor(t={}){super(t),this._minX=t.minX,this._maxX=t.maxX,this._minY=t.minY,this._maxY=t.maxY,this._boundsDirty=!0,this._cachedBounds=null,this.crisp=t.crisp??!0,this.logger.log("Geometry2d",this.x,this.y,this.width,this.height)}update(){this.trace("Geometry2d.update"),this.applyConstraints(),this.getBounds()}get minX(){return this._minX}set minX(t){this._minX=t}get maxX(){return this._maxX}set maxX(t){this._maxX=t}get minY(){return this._minY}set minY(t){this._minY=t}get maxY(){return this._maxY}set maxY(t){this._maxY=t}get boundsDirty(){return this._boundsDirty}applyConstraints(){this._minX!==void 0&&(this.x=Math.max(this.x,this._minX)),this._maxX!==void 0&&(this.x=Math.min(this.x,this._maxX)),this._minY!==void 0&&(this.y=Math.max(this.y,this._minY)),this._maxY!==void 0&&(this.y=Math.min(this.y,this._maxY)),this.crisp&&(this.x=Math.round(this.x),this.y=Math.round(this.y),this.width=Math.round(this.width),this.height=Math.round(this.height))}getBounds(){return(this._boundsDirty||!this._cachedBounds)&&(this._cachedBounds=this.calculateBounds(),this._boundsDirty=!1),this._cachedBounds}calculateBounds(){return{width:this.width,height:this.height,x:this.x,y:this.y}}getLocalPosition(){let t=0,e=0;return this.parent&&(t=this.parent.x,e=this.parent.y),{x:this.x-t-this.width/2,y:this.y-e-this.height/2}}markBoundsDirty(){this._boundsDirty=!0}validateProp(t,e){super.validateProp(t,e);const i=this[e];t!==i&&this.markBoundsDirty()}setTopLeft(t,e){return this.x=t+this.width/2,this.y=e+this.height/2,this}setCenter(t,e){return this.x=t,this.y=e,this}}class Ke extends je{constructor(t={}){super(t),this._debug=!!t.debug,this._debugColor=typeof t.debugColor=="string"?t.debugColor:"#0f0",this.logger.log("Traceable",this.x,this.y,this.width,this.height)}drawDebug(){if(!this._debug)return;const t=this.getDebugBounds();this.logger.log(this.constructor.name,"drawDebug",t.x,t.y,t.width,t.height),m.shapes.outlineRect(t.x,t.y,t.width,t.height,this._debugColor,2)}getDebugBounds(){return{width:this.width,height:this.height,x:-this.width/2,y:-this.height/2}}trace(t="render"){this.logger.log(this.name==null?this.constructor.name:this.name,t,"x",this.x,"y",this.y,"w",this.width,"h",this.height,"opacity",this._opacity,"visible",this._visible,"active",this._active,"debug",this.debug)}}class Je extends Ke{constructor(t={}){super(t),this._visible=t.visible!==!1,this._opacity=typeof t.opacity=="number"?t.opacity:1,this._active=t.active!==!1,this.zIndex=t.zIndex??0,this._shadowColor=t.shadowColor??void 0,this._shadowBlur=t.shadowBlur??0,this._shadowOffsetX=t.shadowOffsetX??0,this._shadowOffsetY=t.shadowOffsetY??0,this._cacheRendering=t.cacheRendering??!1,this._cacheCanvas=null,this._cacheDirty=!0,this._cachePadding=t.cachePadding??2,this._tick=0,this.logger.log("Renderable",this.x,this.y,this.width,this.height)}render(){if(!(!this._visible||this._opacity<=0)){if(m.save(),m.effects.setBlendMode(this._blendMode),this.crisp?m.translateTo(Math.round(this.x),Math.round(this.y)):m.translateTo(this.x,this.y),this.applyShadow(m.ctx),!this._cacheRendering||this.constructor.name==="Renderable")m.opacity.pushOpacity(this._opacity),this.draw(),m.opacity.popOpacity();else{const t=typeof this.width=="number"?this.width:0,e=typeof this.height=="number"?this.height:0,i=this._cachePadding*2,s=Math.ceil(t+i)||1,a=Math.ceil(e+i)||1;(!this._cacheCanvas||this._cacheCanvas.width!==s||this._cacheCanvas.height!==a)&&(this._cacheCanvas=document.createElement("canvas"),this._cacheCanvas.width=s,this._cacheCanvas.height=a,this._cacheDirty=!0),this._cacheDirty&&(this._renderToCache(s,a),this._cacheDirty=!1),m.opacity.pushOpacity(this._opacity);const o=this.rotation??0,r=this.scaleX??1,n=this.scaleY??1;m.img.draw(this._cacheCanvas,0,0,{width:s,height:a,rotation:o,scaleX:r,scaleY:n,anchor:"center"}),m.opacity.popOpacity()}m.restore()}}_renderToCache(t,e){const i=this._cacheCanvas.getContext("2d");i.clearRect(0,0,t,e);const s=m.ctx;m.ctx=i,this._isCaching=!0,i.save(),i.translate(t/2,e/2),this.draw(),i.restore(),this._isCaching=!1,m.ctx=s}invalidateCache(){this._cacheDirty=!0}draw(){this.drawDebug()}update(t){this.trace("Renderable.update"),this._tick+=t,super.update(t)}applyShadow(t){this._shadowColor&&(t.shadowColor=this._shadowColor,t.shadowBlur=this._shadowBlur,t.shadowOffsetX=this._shadowOffsetX,t.shadowOffsetY=this._shadowOffsetY)}get visible(){return this._visible}set visible(t){this._visible=!!t}get width(){return super.width}set width(t){super.width=t,this.invalidateCache()}get height(){return super.height}set height(t){super.height=t,this.invalidateCache()}get active(){return this._active}set active(t){this._active=!!t}get opacity(){return this._opacity}set opacity(t){this._opacity=Math.min(1,Math.max(0,typeof t=="number"?t:1))}get shadowColor(){return this._shadowColor}set shadowColor(t){this._shadowColor=t,this.invalidateCache()}get shadowBlur(){return this._shadowBlur}set shadowBlur(t){this._shadowBlur=t,this.invalidateCache()}get shadowOffsetX(){return this._shadowOffsetX}set shadowOffsetX(t){this._shadowOffsetX=t,this.invalidateCache()}get shadowOffsetY(){return this._shadowOffsetY}set shadowOffsetY(t){this._shadowOffsetY=t,this.invalidateCache()}get tick(){return this._tick}get cacheRendering(){return this._cacheRendering}set cacheRendering(t){this._cacheRendering=!!t,t&&this.invalidateCache()}}const Ie=class fe{constructor(t){this._owner=t}get owner(){return this._owner}x(t){return this._owner._x=t,this._owner.markBoundsDirty(),this}y(t){return this._owner._y=t,this._owner.markBoundsDirty(),this}position(t,e){return this._owner._x=t,this._owner._y=e,this._owner.markBoundsDirty(),this}translateBy(t,e){return this._owner._x+=t,this._owner._y+=e,this._owner.markBoundsDirty(),this}width(t){var e,i;return this._owner._width=Math.max(0,t),this._owner.markBoundsDirty(),(i=(e=this._owner).invalidateCache)==null||i.call(e),this}height(t){var e,i;return this._owner._height=Math.max(0,t),this._owner.markBoundsDirty(),(i=(e=this._owner).invalidateCache)==null||i.call(e),this}size(t,e){var i,s;return this._owner._width=Math.max(0,t),this._owner._height=Math.max(0,e),this._owner.markBoundsDirty(),(s=(i=this._owner).invalidateCache)==null||s.call(i),this}rotation(t){return this._owner._rotation=t*Math.PI/180,this._owner.markBoundsDirty(),this}rotationRad(t){return this._owner._rotation=t,this._owner.markBoundsDirty(),this}rotateBy(t){return this._owner._rotation+=t*Math.PI/180,this._owner.markBoundsDirty(),this}scaleX(t){return this._owner._scaleX=t,this._owner.markBoundsDirty(),this}scaleY(t){return this._owner._scaleY=t,this._owner.markBoundsDirty(),this}scale(t){return this._owner._scaleX=t,this._owner._scaleY=t,this._owner.markBoundsDirty(),this}scaleBy(t){return this._owner._scaleX*=t,this._owner._scaleY*=t,this._owner.markBoundsDirty(),this}set(t){var e,i;let s=!1;return t.x!==void 0&&(this._owner._x=t.x),t.y!==void 0&&(this._owner._y=t.y),t.width!==void 0&&(this._owner._width=Math.max(0,t.width),s=!0),t.height!==void 0&&(this._owner._height=Math.max(0,t.height),s=!0),t.rotation!==void 0&&(this._owner._rotation=t.rotation*Math.PI/180),t.scaleX!==void 0&&(this._owner._scaleX=t.scaleX),t.scaleY!==void 0&&(this._owner._scaleY=t.scaleY),this._owner.markBoundsDirty(),s&&((i=(e=this._owner).invalidateCache)==null||i.call(e)),this}reset(){return this._owner._rotation=0,this._owner._scaleX=1,this._owner._scaleY=1,this._owner.markBoundsDirty(),this}resetAll(){var t,e;return this._owner._x=0,this._owner._y=0,this._owner._width=0,this._owner._height=0,this._owner._rotation=0,this._owner._scaleX=1,this._owner._scaleY=1,this._owner.markBoundsDirty(),(e=(t=this._owner).invalidateCache)==null||e.call(t),this}toObject(){return{x:this._owner._x,y:this._owner._y,width:this._owner._width,height:this._owner._height,rotation:this._owner._rotation*180/Math.PI,scaleX:this._owner._scaleX,scaleY:this._owner._scaleY}}copyFrom(t){const e=t instanceof fe?t.toObject():t;return this.set(e)}static handleDirectSet(t,e){if(fe.strictMode)throw new Error(`Direct property assignment "${t} = ${e}" is disabled. Use shape.transform.${t}(${e}) instead. Set Transform.strictMode = false to allow direct assignment.`);console.warn(`[Deprecation] Direct assignment "${t} = ${e}" is deprecated. Use shape.transform.${t}(${e}) instead.`)}};k(Ie,"strictMode",!1);let Qe=Ie;class re extends Je{constructor(t={}){super(t),this._rotation=t.rotation*Math.PI/180,this._scaleX=t.scaleX??1,this._scaleY=t.scaleY??1,this.transform=new Qe(this),this.logger.log("Transformable",this.x,this.y,this.width,this.height)}draw(){this.applyTransforms(),this.drawDebug()}applyTransforms(){this._isCaching||(m.rotate(this._rotation),m.scale(this._scaleX,this._scaleY))}get rotation(){return this._rotation}set rotation(t){this._rotation=t*Math.PI/180,this.markBoundsDirty()}get scaleX(){return this._scaleX}set scaleX(t){this._scaleX=t,this.markBoundsDirty()}get scaleY(){return this._scaleY}set scaleY(t){this._scaleY=t,this.markBoundsDirty()}calculateBounds(){const t=this.width/2,e=this.height/2,i=[{x:-t,y:-e},{x:t,y:-e},{x:t,y:e},{x:-t,y:e}],s=Math.cos(this._rotation),a=Math.sin(this._rotation),o=i.map(({x:d,y:g})=>{d*=this._scaleX,g*=this._scaleY;const v=d*s-g*a,_=d*a+g*s;return{x:v+this.x,y:_+this.y}}),r=o.map(d=>d.x),n=o.map(d=>d.y),c=Math.min(...r),l=Math.max(...r),u=Math.min(...n),h=Math.max(...n);return{x:(c+l)/2,y:(u+h)/2,width:l-c,height:h-u}}}class te extends re{constructor(t={}){super(t),this._color=t.color??null,this._stroke=t.stroke??null,this._lineWidth=t.lineWidth??1,this._lineJoin=t.lineJoin??"miter",this._lineCap=t.lineCap??"butt",this._miterLimit=t.miterLimit??10,this.logger.log("Shape",this.x,this.y,this.width,this.height)}get color(){return this._color}set color(t){this._color=t,this.invalidateCache()}get stroke(){return this._stroke}set stroke(t){this._stroke=t,this.invalidateCache()}get lineWidth(){return this._lineWidth}set lineWidth(t){this._lineWidth=Math.max(0,t),this.invalidateCache()}get lineJoin(){return this._lineJoin}set lineJoin(t){this._lineJoin=t,this.invalidateCache()}get lineCap(){return this._lineCap}set lineCap(t){this._lineCap=t,this.invalidateCache()}get miterLimit(){return this._miterLimit}set miterLimit(t){this._miterLimit=t,this.invalidateCache()}}class ti extends re{constructor(t={}){super(t),this._collection=new ye({sortByZIndex:t.sortByZIndex||!0}),this._collection._owner=this,this._childrenVersion=0,this._cachedBounds=null,t.width=Math.max(0,t.width||0),t.height=Math.max(0,t.height||0),this.userDefinedWidth=t.width,this.userDefinedHeight=t.height,this.userDefinedDimensions=t.width!==void 0&&t.height!==void 0&&(t.width>0||t.height>0)}add(t){if(t==null||t==null)throw new Error("Object is null or undefined");if(!(t instanceof re))throw new TypeError("Group can only add Transformable instances");return t.parent=this,this._collection.add(t),this._childrenVersion++,this.markBoundsDirty(),this.invalidateCache(),t}remove(t){const e=this._collection.remove(t);return e&&(t.parent=null,this._childrenVersion++,this.markBoundsDirty(),this.invalidateCache()),e}clear(){this._collection.clear(),this._childrenVersion++,this.markBoundsDirty(),this.invalidateCache()}bringToFront(t){return this._collection.bringToFront(t)}sendToBack(t){return this._collection.sendToBack(t)}bringForward(t){return this._collection.bringForward(t)}sendBackward(t){return this._collection.sendBackward(t)}draw(){super.draw(),this.logger.log("Group.draw children:",this.children.length),this._renderChildren()}_renderChildren(){const t=this._collection.getSortedChildren();for(let e=0;e<t.length;e++){const i=t[e];i.visible&&(m.save(),i.render(),m.restore())}}update(t){this.logger.groupCollapsed("Group.update");const e=this._collection.getSortedChildren();for(let i=0;i<e.length;i++){const s=e[i];s.active&&typeof s.update=="function"&&s.update(t)}super.update(t),this.logger.groupEnd()}get children(){var t;return((t=this._collection)==null?void 0:t.children)||[]}get width(){return this.userDefinedDimensions?this._width:this.getBounds().width}set width(t){const e=Math.max(0,t);this._width=e,this.userDefinedWidth=e,this.userDefinedDimensions=(this.userDefinedWidth>0||this.userDefinedHeight>0)&&this.userDefinedWidth!==void 0&&this.userDefinedHeight!==void 0,this.markBoundsDirty()}get height(){return this.userDefinedDimensions?this._height:this.getBounds().height}set height(t){const e=Math.max(0,t);this._height=e,this.userDefinedHeight=e,this.userDefinedDimensions=(this.userDefinedWidth>0||this.userDefinedHeight>0)&&this.userDefinedWidth!==void 0&&this.userDefinedHeight!==void 0,this.markBoundsDirty()}calculateBounds(){var t;if(this.userDefinedDimensions)return{x:this.x,y:this.y,width:this._width,height:this._height};if(!((t=this.children)!=null&&t.length))return{x:this.x,y:this.y,width:0,height:0};let e=1/0,i=1/0,s=-1/0,a=-1/0;for(const n of this.children){const c=n.x,l=n.y,u=n.width,h=n.height,d=c-u/2,g=c+u/2,v=l-h/2,_=l+h/2;e=Math.min(e,d),s=Math.max(s,g),i=Math.min(i,v),a=Math.max(a,_)}const o=s-e,r=a-i;return{x:this.x,y:this.y,width:o,height:r}}getDebugBounds(){const t=this.calculateBounds();return{width:t.width,height:t.height,x:-t.width/2,y:-t.height/2}}forEachTransform(t){return this.children.forEach((e,i)=>{e.transform&&t(e.transform,e,i)}),this}translateChildren(t,e){return this.forEachTransform(i=>i.translateBy(t,e))}scaleChildren(t){return this.forEachTransform(e=>e.scaleBy(t))}rotateChildren(t){return this.forEachTransform(e=>e.rotateBy(t))}resetChildTransforms(){return this.forEachTransform(t=>t.reset())}}class ei extends te{constructor(t={}){super(t)}draw(){super.draw(),this.drawRect()}drawRect(){const t=-this.width/2,e=-this.height/2;this.color&&m.shapes.rect(t,e,this.width,this.height,this.color),this.stroke&&m.shapes.outlineRect(t,e,this.width,this.height,this.stroke,this.lineWidth)}}class Ee{constructor(t,e){if(this.width=t,this.height=e,this.canvas=document.createElement("canvas"),this.canvas.width=t,this.canvas.height=e,this.gl=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!0,preserveDrawingBuffer:!0}),!this.gl){console.warn("WebGL not available, falling back to Canvas 2D"),this.available=!1;return}this.available=!0;const i=this.gl;i.enable(i.BLEND),i.blendFunc(i.ONE,i.ONE_MINUS_SRC_ALPHA),i.viewport(0,0,t,e),this.programs=new Map,this.currentProgram=null,this.uniformLocations=new Map,this._needsAttributeRebind=!1,this._createQuad()}isAvailable(){return this.available}resize(t,e){this.width=t,this.height=e,this.canvas.width=t,this.canvas.height=e,this.gl&&(this.gl.viewport(0,0,t,e),this._needsAttributeRebind=!0)}_createQuad(){const t=this.gl,e=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),i=new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]);this.positionBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW),this.uvBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.uvBuffer),t.bufferData(t.ARRAY_BUFFER,i,t.STATIC_DRAW)}_compileShader(t,e){const i=this.gl,s=i.createShader(t);return i.shaderSource(s,e),i.compileShader(s),i.getShaderParameter(s,i.COMPILE_STATUS)?s:(console.error("Shader compile error:",i.getShaderInfoLog(s)),console.error("Source:",e),i.deleteShader(s),null)}useProgram(t,e,i){if(!this.available)return null;const s=this.gl;if(this.programs.has(t)){const n=this.programs.get(t);return s.useProgram(n),this.currentProgram=t,this._needsAttributeRebind&&(this._bindAttributes(n),this._needsAttributeRebind=!1),n}const a=this._compileShader(s.VERTEX_SHADER,e),o=this._compileShader(s.FRAGMENT_SHADER,i);if(!a||!o)return null;const r=s.createProgram();return s.attachShader(r,a),s.attachShader(r,o),s.linkProgram(r),s.getProgramParameter(r,s.LINK_STATUS)?(this.programs.set(t,r),this.uniformLocations.set(t,new Map),s.useProgram(r),this.currentProgram=t,this._bindAttributes(r),r):(console.error("Program link error:",s.getProgramInfoLog(r)),s.deleteProgram(r),null)}_bindAttributes(t){const e=this.gl,i=e.getAttribLocation(t,"aPosition"),s=e.getAttribLocation(t,"aUv");i!==-1&&(e.bindBuffer(e.ARRAY_BUFFER,this.positionBuffer),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,0,0)),s!==-1&&(e.bindBuffer(e.ARRAY_BUFFER,this.uvBuffer),e.enableVertexAttribArray(s),e.vertexAttribPointer(s,2,e.FLOAT,!1,0,0))}_getUniformLocation(t){const e=this.gl,i=this.programs.get(this.currentProgram),s=this.uniformLocations.get(this.currentProgram);return s.has(t)||s.set(t,e.getUniformLocation(i,t)),s.get(t)}setUniforms(t){if(!this.available||!this.currentProgram)return;const e=this.gl;for(const[i,s]of Object.entries(t)){const a=this._getUniformLocation(i);if(a!==null)if(typeof s=="number")e.uniform1f(a,s);else if(Array.isArray(s))switch(s.length){case 2:e.uniform2fv(a,s);break;case 3:e.uniform3fv(a,s);break;case 4:e.uniform4fv(a,s);break}else s instanceof Float32Array&&(s.length===9?e.uniformMatrix3fv(a,!1,s):s.length===16&&e.uniformMatrix4fv(a,!1,s))}}setColorUniform(t,e){if(!this.available||!this.currentProgram)return;const i=e.replace("#",""),s=parseInt(i.substring(0,2),16)/255,a=parseInt(i.substring(2,4),16)/255,o=parseInt(i.substring(4,6),16)/255,r=this._getUniformLocation(t);r!==null&&this.gl.uniform3f(r,s,a,o)}clear(t=0,e=0,i=0,s=0){if(!this.available)return;const a=this.gl;a.clearColor(t,e,i,s),a.clear(a.COLOR_BUFFER_BIT)}render(){if(!this.available||!this.currentProgram)return;const t=this.gl;t.drawArrays(t.TRIANGLES,0,6)}compositeOnto(t,e,i,s,a){this.available&&t.drawImage(this.canvas,e,i,s??this.canvas.width,a??this.canvas.height)}getCanvas(){return this.canvas}destroy(){if(!this.available)return;const t=this.gl;for(const e of this.programs.values())t.deleteProgram(e);t.deleteBuffer(this.positionBuffer),t.deleteBuffer(this.uvBuffer),this.programs.clear(),this.uniformLocations.clear()}}const ii=`
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,le=`
precision highp float;

varying vec2 vUv;

// Uniforms common to all sphere shaders
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraRotation;  // rotationX, rotationY, rotationZ

// =============================================================================
// NOISE FUNCTIONS
// =============================================================================

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

// 3D Value noise
float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = dot(i, vec3(1.0, 57.0, 113.0));

    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z
    );
}

// FBM (Fractional Brownian Motion)
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise3D(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

// =============================================================================
// RAY-SPHERE INTERSECTION
// =============================================================================

/**
 * Ray-sphere intersection
 * @param rayOrigin - Ray origin (camera position)
 * @param rayDir - Normalized ray direction
 * @param sphereCenter - Sphere center
 * @param sphereRadius - Sphere radius
 * @return t value for intersection, -1.0 if no hit
 */
float raySphereIntersect(vec3 rayOrigin, vec3 rayDir, vec3 sphereCenter, float sphereRadius) {
    vec3 oc = rayOrigin - sphereCenter;
    float a = dot(rayDir, rayDir);
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0.0) {
        return -1.0;
    }

    return (-b - sqrt(discriminant)) / (2.0 * a);
}

// =============================================================================
// CAMERA AND ROTATION
// =============================================================================

/**
 * Create rotation matrix from Euler angles
 */
mat3 rotationMatrix(vec3 rotation) {
    float cx = cos(rotation.x);
    float sx = sin(rotation.x);
    float cy = cos(rotation.y);
    float sy = sin(rotation.y);
    float cz = cos(rotation.z);
    float sz = sin(rotation.z);

    mat3 rx = mat3(
        1.0, 0.0, 0.0,
        0.0, cx, -sx,
        0.0, sx, cx
    );

    mat3 ry = mat3(
        cy, 0.0, sy,
        0.0, 1.0, 0.0,
        -sy, 0.0, cy
    );

    mat3 rz = mat3(
        cz, -sz, 0.0,
        sz, cz, 0.0,
        0.0, 0.0, 1.0
    );

    return rz * ry * rx;
}

/**
 * Calculate ray direction from UV coordinates
 * Uses a simple pinhole camera model
 */
vec3 getRayDirection(vec2 uv) {
    // Convert UV to normalized device coordinates (-1 to 1)
    vec2 ndc = uv * 2.0 - 1.0;
    // Field of view ~53 degrees (atan(0.5) * 2)
    return normalize(vec3(ndc * 0.5, 1.0));
}

// =============================================================================
// LIGHTING
// =============================================================================

/**
 * Simple diffuse + ambient lighting
 */
float lighting(vec3 normal, vec3 lightDir, float ambient) {
    float diffuse = max(0.0, dot(normal, lightDir));
    return ambient + (1.0 - ambient) * diffuse;
}

/**
 * Fresnel effect for rim lighting
 */
float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - abs(dot(normal, viewDir)), power);
}
`,si=`
${le}

uniform vec3 uStarColor;
uniform float uTemperature;      // Kelvin, affects color
uniform float uActivityLevel;    // 0-1, affects turbulence
uniform float uRotationSpeed;    // Self-rotation speed (radians/second)

// Tidal disruption uniforms
uniform float uTidalStretch;     // 0 = sphere, 1+ = elongated toward BH
uniform float uStretchDirX;      // Direction to black hole (X component)
uniform float uStretchDirZ;      // Direction to black hole (Z component)
uniform float uStressLevel;      // 0-1, surface chaos from tidal forces
uniform float uBaseRadius;       // Dynamic base radius for proper sizing
uniform float uTidalFlare;       // 0-1, sudden brightness burst at disruption start
uniform float uTidalWobble;      // 0-1, violent geometry wobble during trauma

// =============================================================================
// TIDAL DISTORTION - True Spaghettification via Ellipsoid Deformation
// Uses ray-ellipsoid intersection for physically correct stretching
// =============================================================================

/**
 * Ray-Ellipsoid intersection
 * Ellipsoid defined by semi-axes (a, b, c) where:
 * - a = stretch along BH direction (in XZ plane)
 * - b = Y axis (slight compression)
 * - c = perpendicular to BH direction in XZ plane (compression)
 *
 * Technique: Transform ray into "unit sphere space" via inverse scaling
 */
float rayEllipsoidIntersect(vec3 rayOrigin, vec3 rayDir, vec3 center, vec3 semiAxes) {
    // Scale ray into unit sphere space
    vec3 scaledOrigin = (rayOrigin - center) / semiAxes;
    vec3 scaledDir = rayDir / semiAxes;

    // Standard ray-sphere intersection in scaled space
    float a = dot(scaledDir, scaledDir);
    float b = 2.0 * dot(scaledOrigin, scaledDir);
    float c = dot(scaledOrigin, scaledOrigin) - 1.0;
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0.0) {
        return -1.0;
    }

    return (-b - sqrt(discriminant)) / (2.0 * a);
}

/**
 * Calculate ellipsoid normal at hit point
 * Normal = gradient of ellipsoid equation = 2*(x/a², y/b², z/c²)
 */
vec3 ellipsoidNormal(vec3 hitPoint, vec3 center, vec3 semiAxes) {
    vec3 localPos = hitPoint - center;
    // Gradient of (x/a)² + (y/b)² + (z/c)² = 1
    vec3 grad = localPos / (semiAxes * semiAxes);
    return normalize(grad);
}

/**
 * Build tidal stretch axes from BH direction
 * Returns semi-axes (stretchAxis, Y, perpAxis) for ellipsoid
 * Includes violent wobble effect during trauma
 */
vec3 tidalSemiAxes(float stretch, vec2 stretchDir, float baseRadius, float wobble, float time) {
    // Stretch factor along BH direction (elongation toward/away from BH)
    float stretchFactor = 1.0 + stretch * 0.8;  // Up to 1.8x longer

    // Compression factor perpendicular (volume roughly conserved)
    float compressFactor = 1.0 / sqrt(stretchFactor);  // Compress to conserve volume

    // Y axis gets slight compression too
    float yFactor = 1.0 - stretch * 0.15;

    // === TRAUMA WOBBLE ===
    // Violent, chaotic geometry distortion during tidal shock
    if (wobble > 0.01) {
        // Multiple frequency wobbles for organic chaos
        float wobble1 = sin(time * 12.0) * cos(time * 7.3);
        float wobble2 = sin(time * 19.0 + 1.5) * cos(time * 11.0);
        float wobble3 = sin(time * 8.0 + 3.0);
        
        // Asymmetric wobble - more violent on stretch axis
        float stretchWobble = wobble * (0.3 + wobble1 * 0.2 + wobble2 * 0.15);
        float yWobble = wobble * (wobble2 * 0.25 + wobble3 * 0.15);
        float perpWobble = wobble * (wobble3 * 0.2 + wobble1 * 0.1);
        
        stretchFactor *= (1.0 + stretchWobble);
        yFactor *= (1.0 + yWobble);
        compressFactor *= (1.0 + perpWobble);
    }

    return vec3(
        baseRadius * stretchFactor,   // Stretch along BH radial
        baseRadius * yFactor,         // Slight Y compression
        baseRadius * compressFactor   // Compress perpendicular
    );
}

// =============================================================================
// PLASMA NOISE with flowing distortion
// =============================================================================

float plasmaNoise(vec3 p, float time) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float totalAmp = 0.0;

    for (int i = 0; i < 5; i++) {
        vec3 offset = vec3(
            sin(time * 0.1 + float(i)) * 0.5,
            cos(time * 0.15 + float(i) * 0.7) * 0.5,
            time * 0.05
        );
        value += amplitude * noise3D((p + offset) * frequency);
        totalAmp += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value / totalAmp;
}

// =============================================================================
// HOT BUBBLES - bright spots that appear and pop
// =============================================================================

float hotBubbles(vec3 p, float time) {
    // Large slow bubbles
    vec3 p1 = p * 5.0 + vec3(0.0, time * 0.06, 0.0);
    float b1 = noise3D(p1);
    b1 = smoothstep(0.3, 0.6, b1);

    // Medium bubbles, faster
    vec3 p2 = p * 9.0 + vec3(time * 0.04, time * 0.08, 0.0);
    float b2 = noise3D(p2);
    b2 = smoothstep(0.35, 0.65, b2);

    // Small rapid bubbles
    vec3 p3 = p * 16.0 + vec3(time * 0.1, 0.0, time * 0.12);
    float b3 = noise3D(p3);
    b3 = smoothstep(0.4, 0.7, b3);

    float bubbles = b1 * 0.5 + b2 * 0.35 + b3 * 0.15;
    float pulse = sin(time * 2.0 + p.x * 10.0) * 0.3 + 0.7;

    return bubbles * pulse;
}

// =============================================================================
// BOILING TURBULENCE - fast chaotic movement
// =============================================================================

float boilingTurbulence(vec3 p, float time) {
    float turb = 0.0;
    float amp = 1.0;
    float freq = 4.0;

    for (int i = 0; i < 4; i++) {
        vec3 offset = vec3(
            sin(time * 0.3 + float(i) * 1.7) * 0.5,
            cos(time * 0.25 + float(i) * 2.3) * 0.5,
            time * 0.15 * (1.0 + float(i) * 0.3)
        );
        turb += amp * abs(noise3D(p * freq + offset));
        amp *= 0.5;
        freq *= 2.1;
    }
    return turb;
}

// =============================================================================
// CORONA FLAMES - structures around the edge
// =============================================================================

float coronaFlames(float angle, float rimFactor, float time, float activity) {
    // Multiple flame frequencies
    float flames = 0.0;

    // Large slow flames
    float f1 = sin(angle * 5.0 + time * 0.5) * 0.5 + 0.5;
    f1 *= noise3D(vec3(angle * 2.0, time * 0.3, 0.0));

    // Medium flames
    float f2 = sin(angle * 12.0 + time * 0.8) * 0.5 + 0.5;
    f2 *= noise3D(vec3(angle * 4.0, time * 0.5, 5.0));

    // Small rapid flames
    float f3 = sin(angle * 25.0 + time * 1.5) * 0.5 + 0.5;
    f3 *= noise3D(vec3(angle * 8.0, time * 0.8, 10.0));

    flames = f1 * 0.5 + f2 * 0.3 + f3 * 0.2;

    // Flames only visible at rim
    flames *= pow(rimFactor, 1.5);
    flames *= 0.5 + activity * 0.5;

    return flames;
}

// =============================================================================
// SELF ROTATION - rotate normal around Y axis
// =============================================================================

vec3 rotateY(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}

void main() {
    // === CIRCULAR MASK - prevents square canvas artifacts ===
    vec2 center = vUv - 0.5;
    float distFromCenter = length(center) * 2.0;

    // Wider cutoff for stretched ellipsoid
    if (distFromCenter > 1.6) {
        gl_FragColor = vec4(0.0);
        return;
    }

    float circularMask = 1.0 - smoothstep(1.3, 1.6, distFromCenter);

    // Setup ray - camera looking at sphere from fixed position
    vec3 rayOrigin = vec3(0.0, 0.0, -2.5);
    vec3 rayDir = getRayDirection(vUv);

    float time = uTime;
    float selfRotation = time * uRotationSpeed;

    // === TIDAL ELLIPSOID SETUP ===
    // Direction toward black hole in XZ plane
    vec2 stretchDir2D = normalize(vec2(uStretchDirX, uStretchDirZ) + 0.0001);
    float stretch = uTidalStretch;

    // Build rotation matrix to align ellipsoid X-axis with stretch direction
    // This rotates the ellipsoid so its long axis points toward the BH
    float stretchAngle = atan(stretchDir2D.y, stretchDir2D.x);
    float cs = cos(stretchAngle);
    float sn = sin(stretchAngle);

    // Rotation matrix around Y axis (to align stretch in XZ plane)
    mat3 stretchRot = mat3(
        cs,  0.0, -sn,
        0.0, 1.0, 0.0,
        sn,  0.0,  cs
    );
    mat3 stretchRotInv = mat3(
        cs,  0.0,  sn,
        0.0, 1.0, 0.0,
        -sn, 0.0,  cs
    );

    // Transform ray into ellipsoid-aligned space
    vec3 rotatedRayDir = stretchRotInv * rayDir;
    vec3 rotatedRayOrigin = stretchRotInv * rayOrigin;

    // Calculate ellipsoid semi-axes based on stretch
    // Use dynamic base radius passed from JS (scales with render texture size)
    // Falls back to 0.4 if uniform not set
    float baseRadius = uBaseRadius > 0.0 ? uBaseRadius : 0.4;
    vec3 semiAxes = tidalSemiAxes(stretch, stretchDir2D, baseRadius, uTidalWobble, time);

    // Ray-ellipsoid intersection for SURFACE
    float t = rayEllipsoidIntersect(rotatedRayOrigin, rotatedRayDir, vec3(0.0), semiAxes);

    // === NO CORONA - just render solid ellipsoid ===
    // If ray doesn't hit the surface, render transparent
    if (t < 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // === SURFACE RENDERING ===
    // Calculate hit point in rotated (ellipsoid-aligned) space
    vec3 rotatedHitPoint = rotatedRayOrigin + rotatedRayDir * t;

    // Calculate ellipsoid normal (gradient of implicit surface)
    vec3 rotatedNormalRaw = ellipsoidNormal(rotatedHitPoint, vec3(0.0), semiAxes);

    // Transform hit point and normal back to world space
    vec3 hitPoint = stretchRot * rotatedHitPoint;
    vec3 normal = normalize(stretchRot * rotatedNormalRaw);

    // Apply inverse camera rotation to the normal (camera orbit)
    mat3 camRotMat = rotationMatrix(-uCameraRotation);
    vec3 rotatedNormal = camRotMat * normal;

    // Apply self-rotation to surface features
    rotatedNormal = rotateY(rotatedNormal, selfRotation);

    // === SPHERICAL DISTORTION for boiling effect ===
    vec2 sp = normal.xy;
    float r = dot(sp, sp);

    float brightness = 0.15 + (uTemperature / 10000.0) * 0.1;
    float distortStrength = 2.0 - brightness;

    vec2 warpedUV;
    if (r < 0.0001) {
        // At pole - use alternative coords
        float poleAngle = atan(rotatedNormal.y, rotatedNormal.x) + time * 0.15;
        float poleElev = acos(clamp(rotatedNormal.z, -1.0, 1.0));
        warpedUV = vec2(cos(poleAngle), sin(poleAngle)) * (poleElev / 3.14159) * distortStrength;
    } else {
        sp *= distortStrength;
        r = dot(sp, sp);
        float f = (1.0 - sqrt(abs(1.0 - r))) / (r + 0.001) + brightness * 0.5;
        warpedUV = sp * f + vec2(time * 0.05, 0.0);
    }

    // === PLASMA TEXTURE ===
    vec3 plasmaCoord = vec3(warpedUV * 3.0, time * 0.12);
    float plasma1 = plasmaNoise(plasmaCoord, time);
    float plasma2 = plasmaNoise(plasmaCoord * 1.3 + vec3(50.0), time * 1.2);
    float plasma = plasma1 * 0.6 + plasma2 * 0.4;
    plasma = plasma * 0.5 + 0.5;

    // === VIEW GEOMETRY ===
    float viewAngle = dot(normal, -rayDir);
    float edgeDist = 1.0 - viewAngle;
    float limbDarkening = pow(max(0.0, viewAngle), 0.4);

    // === TIDAL FACE INTENSITY ===
    // The side facing the black hole experiences more violent tidal forces
    // Calculate how much this surface point faces the BH direction
    vec3 bhDir3D = normalize(vec3(uStretchDirX, 0.0, uStretchDirZ));
    float facingBH = dot(normal, bhDir3D);  // -1 to 1, positive = facing BH
    float tidalFace = smoothstep(-0.2, 0.8, facingBH);  // Gradual transition
    tidalFace = tidalFace * tidalFace;  // More concentrated on BH side
    
    // Tidal face boost - up to 3x more violent on the BH-facing side
    float tidalFaceBoost = 1.0 + tidalFace * uStressLevel * 2.0;

    // === MULTI-LAYER EFFECTS (stress-enhanced) ===
    // Stress amplifies all turbulent effects - star is being torn apart!
    // Much more violent - up to 5x chaos at max stress
    float stressBoost = 1.0 + uStressLevel * 4.0;
    
    // Combined boost: general stress + extra violence on BH-facing side
    float combinedBoost = stressBoost * tidalFaceBoost;

    float turbIntensity = boilingTurbulence(rotatedNormal, time * combinedBoost) * 0.6;
    turbIntensity *= combinedBoost;

    float bubbles = hotBubbles(rotatedNormal, time * combinedBoost);
    bubbles *= combinedBoost * 1.5;  // More dramatic bubbles on tidal face

    // Granulation becomes violent under stress - larger and faster
    float gran = noise3D(rotatedNormal * 15.0 + time * 0.5 * combinedBoost);
    gran *= combinedBoost * 1.2;

    // === TIDAL FRACTURING ===
    // Stress causes visible cracks/tears - concentrated on BH-facing side
    float fractures = 0.0;
    if (uStressLevel > 0.15) {  // Start fractures earlier (was 0.3)
        // Fractures are more intense on the tidal face
        float fractureBoost = 1.0 + tidalFace * 2.0;  // Up to 3x on BH side
        float fractureNoise = noise3D(rotatedNormal * 6.0 + time * 0.8 * fractureBoost);
        float fractureThreshold = 1.0 - (uStressLevel - 0.15) * 1.2 * fractureBoost;
        fractures = smoothstep(fractureThreshold, fractureThreshold + 0.08, fractureNoise);
        fractures *= uStressLevel * 1.2 * fractureBoost;  // More intense on BH side
    }

    // === PULSATION (amplified by stress) ===
    float pulse1 = cos(time * 0.5) * 0.5;
    float pulse2 = sin(time * 0.25) * 0.5;
    float pulseAmp = uActivityLevel * (1.0 + uStressLevel);
    float pulse = (pulse1 + pulse2) * 0.3 * pulseAmp;

    // === TIDAL HOTSPOT ===
    // Bright glowing region on the BH-facing side - like matter being pulled off
    float tidalHotspot = pow(tidalFace, 3.0) * uStressLevel;
    // Add some flickering/chaos to the hotspot
    tidalHotspot *= 0.7 + 0.3 * noise3D(rotatedNormal * 8.0 + time * 2.0);

    // === COMBINED INTENSITY ===
    float totalIntensity = plasma * 0.35 + turbIntensity * 0.25 + gran * 0.2;
    totalIntensity += bubbles * 0.4;
    totalIntensity += fractures * 0.5;  // Fractures glow hot
    totalIntensity += tidalHotspot * 0.8;  // Bright tidal hotspot
    totalIntensity *= 1.0 + pulse;

    // === 4-TIER COLOR SYSTEM ===
    vec3 baseColor = uStarColor;
    float maxComp = max(baseColor.r, max(baseColor.g, baseColor.b));
    if (maxComp > 0.01) baseColor = baseColor / maxComp * 0.85;

    // Temperature-based color blending
    float tempBlend = smoothstep(5000.0, 7500.0, uTemperature);

    vec3 hotColor = baseColor * vec3(1.6, 1.35, 1.2);
    vec3 coolColor = mix(baseColor * vec3(0.5, 0.3, 0.2), baseColor * vec3(0.7, 0.8, 0.95), tempBlend);
    vec3 warmColor = mix(baseColor * vec3(1.2, 1.0, 0.85), baseColor * vec3(1.0, 1.05, 1.2), tempBlend);
    vec3 blazingColor = mix(baseColor * vec3(2.0, 1.6, 1.3), baseColor * vec3(1.4, 1.5, 1.8), tempBlend);

    // Map intensity to color
    vec3 surfaceColor;
    if (totalIntensity < 0.35) {
        surfaceColor = mix(coolColor, warmColor, totalIntensity / 0.35);
    } else if (totalIntensity < 0.65) {
        surfaceColor = mix(warmColor, hotColor, (totalIntensity - 0.35) / 0.3);
    } else if (totalIntensity < 1.0) {
        surfaceColor = mix(hotColor, blazingColor, (totalIntensity - 0.65) / 0.35);
    } else {
        surfaceColor = blazingColor * (1.0 + (totalIntensity - 1.0) * 0.8);
    }

    // Bubble highlights
    float bubbleHighlight = pow(bubbles, 1.5) * turbIntensity;
    surfaceColor += blazingColor * bubbleHighlight * 0.6;

    // === LIMB DARKENING ===
    surfaceColor *= 0.75 + limbDarkening * 0.25;

    // === ORGANIC RIM GLOW ===
    float rimAngle = atan(normal.y, normal.x) + selfRotation;
    float rimNoise = noise3D(vec3(rimAngle * 3.0, edgeDist * 2.0, time * 0.2));
    rimNoise = rimNoise * 0.5 + 0.5;

    float rimIntensity = pow(edgeDist, 2.0) * (0.4 + rimNoise * 0.6);
    vec3 rimColor = baseColor * vec3(1.3, 0.95, 0.6);
    surfaceColor += rimColor * rimIntensity * 0.6 * uActivityLevel;

    // === EDGE GLOW (corona bleeding into surface) ===
    float edgeGlow = pow(edgeDist, 0.5) * 0.3 * uActivityLevel;
    surfaceColor += warmColor * edgeGlow;

    // === CENTER BOOST ===
    float centerBoost = pow(viewAngle, 1.5) * 0.2;
    surfaceColor += baseColor * centerBoost;

    // === SHIMMER ===
    float shimmer = sin(turbIntensity * 10.0 + time * 3.0) * 0.05 + 1.0;
    surfaceColor *= shimmer;

    // === TIDAL FLARE ===
    // Sudden brightness burst when disruption begins
    // Concentrated on the BH-facing side with violent flickering
    if (uTidalFlare > 0.01) {
        // Flare is brightest on the BH-facing side
        float flareFace = 0.3 + tidalFace * 0.7;
        
        // Violent flickering during the flare
        float flareFlicker = 0.7 + 0.3 * noise3D(rotatedNormal * 10.0 + time * 8.0);
        
        // White-hot flare color
        vec3 flareColor = vec3(1.0, 0.95, 0.8);
        
        // Additive flare - makes entire star brighter
        float flareIntensity = uTidalFlare * flareFace * flareFlicker * 2.0;
        surfaceColor += flareColor * flareIntensity;
        
        // Extra bloom at the BH-facing tip
        float tipFlare = pow(tidalFace, 4.0) * uTidalFlare * 1.5;
        surfaceColor += vec3(1.0, 0.9, 0.7) * tipFlare;
    }

    surfaceColor = clamp(surfaceColor, 0.0, 3.5);  // Allow brighter for flare

    gl_FragColor = vec4(surfaceColor, 1.0);
}
`,ai=`
${le}

uniform float uAwakeningLevel;  // 0 = dormant, 1 = fully active
uniform float uFeedingPulse;    // Temporary glow from feeding
uniform float uRotation;        // Black hole spin angle (Kerr rotation)

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center) * 2.0;  // 0 at center, 1 at edge
    float angle = atan(center.y, center.x);

    float time = uTime;
    float awakeFactor = uAwakeningLevel;
    float pulseFactor = uFeedingPulse;

    // Spin angle for rotating effects (frame dragging)
    // Using uTime since custom uniforms don't update properly
    float spinAngle = angle + uTime * 4.0;  // Faster spin

    // === RADII (normalized to quad size) ===
    float eventHorizon = 0.42;          // Slightly larger core
    float photonSphere = 0.54;          // Tighten ring closer to horizon
    float shadowEdge = 0.5;             // Shadow boundary

    // === CIRCULAR MASK ===
    if (dist > 1.5) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // === NO INTERNAL STARFIELD ===
    // The real starfield is rendered separately in the scene
    // This shader just renders the dark void + subtle edge effects
    // True gravitational lensing would require render-to-texture of background

    // === EVENT HORIZON - Gradient from pure black to very dark edge ===
    // Edge color ~#110b06 = RGB(17,11,6) = vec3(0.067, 0.043, 0.024)
    if (dist < shadowEdge) {
        // Use shadowEdge (0.52) as outer boundary for smooth transition to ring
        float edgeT = dist / shadowEdge;  // 0 at center, 1 at shadow edge

        // Very steep curve - stays pure black until very close to edge
        float glowFactor = pow(edgeT, 8.0);

        // Very dark brownish-black - NO yellow, matches #110b06
        vec3 edgeColor = vec3(0.067, 0.043, 0.024) * glowFactor;

        gl_FragColor = vec4(edgeColor, 1.0);
        return;
    }

    // === PHOTON SPHERE - Subtle ring with gentler spin asymmetry ===
    float photonRingWidth = 0.035;
    float photonDist = abs(dist - photonSphere);
    float photonRing = exp(-photonDist * photonDist / (photonRingWidth * photonRingWidth));

    // Softer Doppler asymmetry to avoid pointy highlights
    float doppler = 0.78 + 0.22 * cos(spinAngle);  // narrower asymmetry
    photonRing *= 0.18 + doppler * 0.38;           // 18%..56% brightness

    // Soft tip highlight to indicate spin without a spike
    float tipAlign = max(0.0, cos(spinAngle));
    float tipRadial = smoothstep(photonRingWidth * 1.2, 0.0, photonDist);
    float hotSpotGlow = tipAlign * tipAlign * tipRadial * 0.25;

    // Scale with awakening - more visible when feeding
    photonRing *= 0.15 + awakeFactor * 0.35;

    // === FEEDING PULSE - Subtle ripple when consuming ===
    float pulseRipple = 0.0;
    if (pulseFactor > 0.01) {
        float ripplePhase = fract(time * 1.5) * 0.3;
        float rippleRadius = shadowEdge + ripplePhase;
        float ripple = exp(-pow(dist - rippleRadius, 2.0) * 80.0);
        pulseRipple = ripple * pulseFactor * 0.15;  // Subtle
    }

    // === EDGE GLOW - keep subtle; avoid wide smear
    float edgeGlow = 0.0;
    if (dist > shadowEdge && dist < photonSphere + 0.08) {
        float edgeFactor = smoothstep(shadowEdge, photonSphere, dist);
        edgeFactor *= smoothstep(photonSphere + 0.08, photonSphere, dist);
        edgeGlow = edgeFactor * pulseFactor * 0.06;
    }

    // === COMBINE EFFECTS ===
    vec3 color = vec3(0.0);

    // Photon sphere ring (warm orange-yellow)
    vec3 photonColor = vec3(1.0, 0.8, 0.45);
    color += photonColor * photonRing;

    // Soft tip highlight (spin indicator)
    vec3 hotSpotColor = vec3(1.0, 0.9, 0.65);
    color += hotSpotColor * hotSpotGlow;

    // Edge glow when feeding
    vec3 glowColor = vec3(1.0, 0.5, 0.2);
    color += glowColor * edgeGlow;

    // Feeding pulse ripple
    vec3 pulseColor = vec3(1.0, 0.6, 0.3);
    color += pulseColor * pulseRipple;

    // === OUTER FADE ===
    float outerFade = 1.0 - smoothstep(0.9, 1.25, dist);
    color *= outerFade;

    // === ALPHA ===
    // Event horizon and photon sphere are fully opaque to occlude background
    float alpha;
    if (dist < photonSphere) {
        alpha = 1.0;
        color = (dist < shadowEdge) ? vec3(0.0) : color; // keep core solid black
    } else {
        // Alpha based on visible content
        float contentBrightness = max(max(color.r, color.g), color.b);
        alpha = smoothstep(0.01, 0.06, contentBrightness);
        alpha = max(alpha, smoothstep(photonSphere + 0.12, shadowEdge, dist) * 0.25);
        alpha *= outerFade;
    }

    gl_FragColor = vec4(color, alpha);
}
`,ri=`
${le}

uniform vec3 uBaseColor;
uniform float uHasAtmosphere;  // 0-1
uniform float uSeed;

void main() {
    // Setup ray - camera looking at sphere from fixed position
    vec3 rayOrigin = vec3(0.0, 0.0, -2.5);
    vec3 rayDir = getRayDirection(vUv);

    // Ray-sphere intersection (sphere at origin with radius 0.5)
    float t = raySphereIntersect(rayOrigin, rayDir, vec3(0.0), 0.5);

    if (t < 0.0) {
        // Atmosphere halo
        if (uHasAtmosphere > 0.0) {
            vec2 center = vUv - 0.5;
            float dist = length(center) * 2.0;
            float atmo = smoothstep(0.6, 0.5, dist) * smoothstep(0.45, 0.52, dist);
            atmo *= uHasAtmosphere * 0.4;
            vec3 atmoColor = vec3(0.5, 0.7, 1.0) * atmo;
            // Premultiplied alpha
            gl_FragColor = vec4(atmoColor * atmo, atmo);
        } else {
            gl_FragColor = vec4(0.0);
        }
        return;
    }

    // Calculate hit point and normal
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = normalize(hitPoint);

    // Apply inverse camera rotation for surface features
    mat3 rotMat = rotationMatrix(-uCameraRotation);
    vec3 rotatedNormal = rotMat * normal;

    // Seeded noise for consistent terrain
    vec3 noiseCoord = rotatedNormal * 4.0 + uSeed * 100.0;
    float terrain = fbm(noiseCoord, 5);

    // Height-based coloring
    vec3 lowColor = uBaseColor * 0.6;    // Valleys/lowlands
    vec3 highColor = uBaseColor * 1.2;   // Mountains/highlands
    vec3 surfaceColor = mix(lowColor, highColor, terrain);

    // Add some variation
    float variation = noise3D(rotatedNormal * 10.0 + uSeed * 50.0);
    surfaceColor *= 0.9 + variation * 0.2;

    // Lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
    float light = lighting(normal, lightDir, 0.3);
    surfaceColor *= light;

    // Atmosphere scattering at edges
    if (uHasAtmosphere > 0.0) {
        float rim = fresnel(normal, -rayDir, 3.0);
        vec3 atmoColor = vec3(0.5, 0.7, 1.0);
        surfaceColor = mix(surfaceColor, atmoColor, rim * uHasAtmosphere * 0.4);
    }

    gl_FragColor = vec4(surfaceColor, 1.0);
}
`,oi=`
${le}

uniform vec3 uBaseColor;
uniform float uSeed;
uniform float uStormIntensity;  // 0-1
uniform float uRotationSpeed;   // rotation speed multiplier (default ~0.1)

void main() {
    // Setup ray - camera looking at sphere from fixed position
    vec3 rayOrigin = vec3(0.0, 0.0, -2.5);
    vec3 rayDir = getRayDirection(vUv);

    // Ray-sphere intersection (sphere at origin with radius 0.5)
    float t = raySphereIntersect(rayOrigin, rayDir, vec3(0.0), 0.5);

    if (t < 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Calculate hit point and normal
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = normalize(hitPoint);

    // Apply inverse camera rotation for surface features
    mat3 rotMat = rotationMatrix(-uCameraRotation);
    vec3 rotatedNormal = rotMat * normal;

    // Convert to spherical coordinates for banding (use rotated normal)
    float latitude = asin(rotatedNormal.y);  // -PI/2 to PI/2
    float longitude = atan(rotatedNormal.z, rotatedNormal.x);  // -PI to PI

    // Animated rotation (use uRotationSpeed, default to 0.1 if not set)
    float rotSpeed = uRotationSpeed > 0.0 ? uRotationSpeed : 0.1;
    float time = uTime * rotSpeed;

    // Create bands based on latitude
    float bands = sin(latitude * 15.0 + time) * 0.5 + 0.5;
    bands += sin(latitude * 25.0 - time * 0.5) * 0.25;
    bands += sin(latitude * 40.0 + time * 0.3) * 0.125;

    // Turbulent distortion of bands
    vec3 noiseCoord = vec3(longitude + time * 0.2, latitude * 3.0, uSeed);
    float turb = fbm(noiseCoord * 5.0, 4) * 0.3;
    bands += turb;

    // Color variation based on bands
    vec3 lightBand = uBaseColor * 1.3;
    vec3 darkBand = uBaseColor * 0.7;
    vec3 surfaceColor = mix(darkBand, lightBand, bands);

    // Add storm features
    if (uStormIntensity > 0.0) {
        // Great red spot style storm
        float stormLat = 0.3;  // Storm latitude
        float stormLon = time * 0.5;  // Storm drifts
        vec2 stormCenter = vec2(stormLon, stormLat);
        vec2 pos = vec2(longitude, latitude);
        float stormDist = length(pos - stormCenter);
        float storm = smoothstep(0.5, 0.2, stormDist);
        storm *= uStormIntensity;

        // Storm color and swirl
        vec3 stormColor = vec3(0.8, 0.3, 0.2);
        float swirl = sin(stormDist * 20.0 - time * 3.0) * 0.5 + 0.5;
        surfaceColor = mix(surfaceColor, stormColor * swirl, storm);
    }

    // Lighting with some subsurface scattering effect
    vec3 lightDir = normalize(vec3(1.0, 0.5, 0.3));
    float light = lighting(normal, lightDir, 0.4);
    surfaceColor *= light;

    // Limb darkening
    float viewAngle = dot(normal, -rayDir);
    surfaceColor *= 0.7 + max(0.0, viewAngle) * 0.3;

    gl_FragColor = vec4(surfaceColor, 1.0);
}
`,Et={vertex:ii,star:si,blackHole:ai,rockyPlanet:ri,gasGiant:oi},Pe=class _t extends te{static _getGLRenderer(t,e){return _t._glRenderer?(_t._glRendererSize.width!==t||_t._glRendererSize.height!==e)&&(_t._glRenderer.resize(t,e),_t._glRendererSize={width:t,height:e}):(_t._glRenderer=new Ee(t,e),_t._glRendererSize={width:t,height:e}),_t._glRenderer}constructor(t,e={}){super(e),this.radius=t,this.camera=e.camera??null,this.debug=e.debug??!1,this.segments=e.segments??20,this.useShader=e.useShader??!1,this.shaderType=e.shaderType??"star",this.shaderUniforms=e.shaderUniforms??{},this._shaderInitialized=!1,this.selfRotationX=e.selfRotationX??0,this.selfRotationY=e.selfRotationY??0,this.selfRotationZ=e.selfRotationZ??0,this._generateGeometry()}setCamera(t){return this.camera=t,this}setShaderUniforms(t){return Object.assign(this.shaderUniforms,t),this}_getFragmentShader(){switch(this.shaderType){case"star":return Et.star;case"blackHole":return Et.blackHole;case"rockyPlanet":return Et.rockyPlanet;case"gasGiant":return Et.gasGiant;default:return Et.star}}_initShader(t,e){const i=_t._getGLRenderer(t,e);if(!i||!i.isAvailable()){this.useShader=!1;return}const s=`sphere_${this.shaderType}`;i.useProgram(s,Et.vertex,this._getFragmentShader()),this._shaderInitialized=!0}_renderWithShader(t,e,i,s){var a,o,r,n;const l=1+(((a=this.shaderUniforms)==null?void 0:a.uTidalStretch)??0),u=s*l,h=Math.ceil((s+u)*2),d=_t._getGLRenderer(h,h);if(!d||!d.isAvailable())return!1;this._shaderInitialized||this._initShader(h,h);const g=`sphere_${this.shaderType}`;d.useProgram(g,Et.vertex,this._getFragmentShader()),d.clear(0,0,0,0);const _=1.25*s/(h/2);d.setUniforms({uTime:performance.now()/1e3,uResolution:[h,h],uBaseRadius:_,uCameraRotation:[((o=this.camera)==null?void 0:o.rotationX)??0,((r=this.camera)==null?void 0:r.rotationY)??0,((n=this.camera)==null?void 0:n.rotationZ)??0]}),d.setUniforms(this.shaderUniforms);for(const[M,x]of Object.entries(this.shaderUniforms))typeof x=="string"&&x.startsWith("#")&&d.setColorUniform(M,x);d.render();const b=e-h/2,y=i-h/2;return d.compositeOnto(t,b,y,h,h),!0}_generateGeometry(){this.vertices=[],this.faces=[];const t=this.segments,e=this.segments*2;for(let i=0;i<=t;i++){const s=i*Math.PI/t,a=Math.sin(s),o=Math.cos(s);for(let r=0;r<=e;r++){const n=r*2*Math.PI/e,c=Math.sin(n),l=Math.cos(n),u=this.radius*a*l,h=this.radius*o,d=this.radius*a*c;this.vertices.push({x:u,y:h,z:d,nx:a*l,ny:o,nz:a*c})}}for(let i=0;i<t;i++)for(let s=0;s<e;s++){const a=i*(e+1)+s,o=a+e+1;this.faces.push([a,o,a+1]),this.faces.push([o,o+1,a+1])}}_applySelfRotation(t,e,i){if(this.selfRotationY!==0){const s=Math.cos(this.selfRotationY),a=Math.sin(this.selfRotationY),o=t*s-i*a,r=t*a+i*s;t=o,i=r}if(this.selfRotationX!==0){const s=Math.cos(this.selfRotationX),a=Math.sin(this.selfRotationX),o=e*s-i*a,r=e*a+i*s;e=o,i=r}if(this.selfRotationZ!==0){const s=Math.cos(this.selfRotationZ),a=Math.sin(this.selfRotationZ),o=t*s-e*a,r=t*a+e*s;t=o,e=r}return{x:t,y:e,z:i}}_calculateLighting(t,e,i){const r=Math.sqrt(.99),n=.5/r,c=.7/r,l=.5/r;let u=t*n+e*c+i*l;return u=Math.max(0,u)*.7+.3,u}_applyLighting(t,e){if(!t||typeof t!="string"||!t.startsWith("#"))return t;const i=t.replace("#",""),s=parseInt(i.substring(0,2),16),a=parseInt(i.substring(2,4),16),o=parseInt(i.substring(4,6),16),r=Math.round(s*e),n=Math.round(a*e),c=Math.round(o*e);return`rgb(${r}, ${n}, ${c})`}draw(){if(super.draw(),!this.camera){this.color&&m.shapes.fillCircle(0,0,this.radius,this.color),this.debug&&this.stroke&&m.shapes.strokeCircle(0,0,this.radius,this.stroke,this.lineWidth);return}if(this.useShader&&!this.debug){const s=this.camera.project(this.x||0,this.y||0,this.z||0),a=this.camera.perspective/(this.camera.perspective+s.z),o=this.radius*a,r=m.ctx,n=r.getTransform(),c=n.e,l=n.f;r.save(),r.setTransform(1,0,0,1,0,0);const u=this._renderWithShader(r,c+s.x,l+s.y,o);if(r.restore(),u)return}const t=this.selfRotationX!==0||this.selfRotationY!==0||this.selfRotationZ!==0,e=this.vertices.map(s=>{let a=s.x,o=s.y,r=s.z,n=s.nx,c=s.ny,l=s.nz;if(t){const x=this._applySelfRotation(a,o,r);a=x.x,o=x.y,r=x.z;const w=this._applySelfRotation(n,c,l);n=w.x,c=w.y,l=w.z}const u=this.camera.project(a+(this.x||0),o+(this.y||0),r+(this.z||0));if(this.camera.rotationZ!==0){const x=Math.cos(this.camera.rotationZ),w=Math.sin(this.camera.rotationZ),S=n,C=c;n=S*x-C*w,c=S*w+C*x}const h=Math.cos(this.camera.rotationY),d=Math.sin(this.camera.rotationY),g=n*h-l*d,v=n*d+l*h,_=Math.cos(this.camera.rotationX),b=Math.sin(this.camera.rotationX),y=c*_-v*b,M=c*b+v*_;return{...u,nx:g,ny:y,nz:M}});this.debug&&this.trace("Sphere3D.draw: projected vertices",e.length);const i=[];for(const s of this.faces){const a=e[s[0]],o=e[s[1]],r=e[s[2]];if(a.z<-this.camera.perspective+10||o.z<-this.camera.perspective+10||r.z<-this.camera.perspective+10)continue;const n=(a.z+o.z+r.z)/3,c=(a.nx+o.nx+r.nx)/3,l=(a.ny+o.ny+r.ny)/3,u=(a.nz+o.nz+r.nz)/3;if(u>.1)continue;const h=this._calculateLighting(c,l,u);i.push({vertices:[a,o,r],avgZ:n,intensity:h})}i.sort((s,a)=>a.avgZ-s.avgZ);for(const s of i){const a=s.vertices.map(o=>({x:o.x,y:o.y}));if(this.debug)m.ctx.beginPath(),m.ctx.moveTo(a[0].x,a[0].y),m.ctx.lineTo(a[1].x,a[1].y),m.ctx.lineTo(a[2].x,a[2].y),m.ctx.closePath(),this.stroke&&(m.ctx.strokeStyle=this.stroke,m.ctx.lineWidth=this.lineWidth??1,m.ctx.stroke());else if(this.color){const o=this._applyLighting(this.color,s.intensity);m.ctx.beginPath(),m.ctx.moveTo(a[0].x,a[0].y),m.ctx.lineTo(a[1].x,a[1].y),m.ctx.lineTo(a[2].x,a[2].y),m.ctx.closePath(),m.ctx.fillStyle=o,m.ctx.fill()}}}calculateBounds(){const t=this.radius*2;return{x:this.x,y:this.y,width:t,height:t}}};k(Pe,"_glRenderer",null);k(Pe,"_glRendererSize",{width:0,height:0});const ni=`
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,ce=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;

// =============================================================================
// NOISE FUNCTIONS
// =============================================================================

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value noise
float noise2D(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash2(i);
    float b = hash2(i + vec2(1.0, 0.0));
    float c = hash2(i + vec2(0.0, 1.0));
    float d = hash2(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM (Fractional Brownian Motion)
float fbm2D(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise2D(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}
`,li=`
${ce}

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uAngle;

void main() {
    vec2 uv = vUv;

    // Calculate gradient direction from angle
    vec2 dir = vec2(cos(uAngle), sin(uAngle));

    // Project UV onto gradient direction
    // Center at 0.5 so gradient goes through middle
    float t = dot(uv - 0.5, dir) + 0.5;
    t = clamp(t, 0.0, 1.0);

    // Interpolate colors
    vec3 color = mix(uColor1, uColor2, t);

    gl_FragColor = vec4(color, 1.0);
}
`,ci=`
${ce}

uniform vec3 uLineColor;
uniform vec3 uBackgroundColor;
uniform float uGridSize;
uniform float uLineWidth;

void main() {
    vec2 uv = vUv;

    // Scale UV to grid space
    vec2 grid = fract(uv * uGridSize);

    // Calculate distance to nearest grid line
    float lineX = min(grid.x, 1.0 - grid.x);
    float lineY = min(grid.y, 1.0 - grid.y);

    // Smoothstep for anti-aliased lines
    float halfWidth = uLineWidth * 0.5;
    float edgeSmooth = 0.01;

    float lineAlphaX = 1.0 - smoothstep(halfWidth - edgeSmooth, halfWidth + edgeSmooth, lineX);
    float lineAlphaY = 1.0 - smoothstep(halfWidth - edgeSmooth, halfWidth + edgeSmooth, lineY);
    float lineAlpha = max(lineAlphaX, lineAlphaY);

    // Mix colors
    vec3 color = mix(uBackgroundColor, uLineColor, lineAlpha);

    gl_FragColor = vec4(color, 1.0);
}
`,hi=`
${ce}

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uSize;

void main() {
    vec2 uv = vUv;

    // Calculate which square we're in
    vec2 cell = floor(uv * uSize);

    // Alternating pattern based on cell coordinates
    float checker = mod(cell.x + cell.y, 2.0);

    // Select color
    vec3 color = mix(uColor1, uColor2, checker);

    gl_FragColor = vec4(color, 1.0);
}
`,ui=`
${ce}

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseScale;
uniform float uAnimSpeed;

void main() {
    vec2 uv = vUv;

    // Animated noise
    float n = fbm2D(uv * uNoiseScale + uTime * uAnimSpeed, 4);

    // Map noise to colors
    vec3 color = mix(uColor1, uColor2, n);

    gl_FragColor = vec4(color, 1.0);
}
`,Pt={vertex:ni,gradient:li,grid:ci,checkerboard:hi,noise:ui},Be=class yt extends te{static _getGLRenderer(t,e){return yt._glRenderer?(yt._glRendererSize.width!==t||yt._glRendererSize.height!==e)&&(yt._glRenderer.resize(t,e),yt._glRendererSize={width:t,height:e}):(yt._glRenderer=new Ee(t,e),yt._glRendererSize={width:t,height:e}),yt._glRenderer}constructor(t,e,i={}){super(i),this.planeWidth=t,this.planeHeight=e,this.x=i.x??0,this.y=i.y??0,this.z=i.z??0,this.camera=i.camera??null,this.debug=i.debug??!1,this.doubleSided=i.doubleSided??!0,this.texture=i.texture??null,this.selfRotationX=i.selfRotationX??0,this.selfRotationY=i.selfRotationY??0,this.selfRotationZ=i.selfRotationZ??0,this.useShader=i.useShader??!1,this.shaderType=i.shaderType??"gradient",this.shaderUniforms=i.shaderUniforms??{},this._shaderInitialized=!1,this._generateGeometry()}setCamera(t){return this.camera=t,this}setTexture(t){return this.texture=t,this}setShaderUniforms(t){return Object.assign(this.shaderUniforms,t),this}_generateGeometry(){const t=this.planeWidth/2,e=this.planeHeight/2;this.vertices=[{x:-t,y:-e,z:0,nx:0,ny:0,nz:-1,u:0,v:0},{x:t,y:-e,z:0,nx:0,ny:0,nz:-1,u:1,v:0},{x:t,y:e,z:0,nx:0,ny:0,nz:-1,u:1,v:1},{x:-t,y:e,z:0,nx:0,ny:0,nz:-1,u:0,v:1}],this.faces=[[0,1,2],[0,2,3]]}_getFragmentShader(){switch(this.shaderType){case"gradient":return Pt.gradient;case"grid":return Pt.grid;case"checkerboard":return Pt.checkerboard;case"noise":return Pt.noise;default:return Pt.gradient}}_initShader(t,e){const i=yt._getGLRenderer(t,e);if(!i||!i.isAvailable())return!1;const s=`plane_${this.shaderType}`,a=Pt.vertex,o=this._getFragmentShader();try{return i.useProgram(s,a,o),this._shaderInitialized=!0,!0}catch(r){return console.warn("Plane3D shader init failed:",r),!1}}_renderWithShader(t,e,i,s,a){const o=Math.max(Math.ceil(Math.max(s,a)),16);if(!this._shaderInitialized&&!this._initShader(o,o))return!1;const r=yt._getGLRenderer(o,o);if(!r||!r.isAvailable())return!1;const n=`plane_${this.shaderType}`;r.useProgram(n,Pt.vertex,this._getFragmentShader());const c=performance.now()/1e3;r.setUniforms({uTime:c,uResolution:[o,o]}),r.setUniforms(this.shaderUniforms),r.render();const l=e-s/2,u=i-a/2;return r.compositeOnto(t,l,u,s,a),!0}_applySelfRotation(t,e,i){if(this.selfRotationY!==0){const s=Math.cos(this.selfRotationY),a=Math.sin(this.selfRotationY),o=t*s-i*a,r=t*a+i*s;t=o,i=r}if(this.selfRotationX!==0){const s=Math.cos(this.selfRotationX),a=Math.sin(this.selfRotationX),o=e*s-i*a,r=e*a+i*s;e=o,i=r}if(this.selfRotationZ!==0){const s=Math.cos(this.selfRotationZ),a=Math.sin(this.selfRotationZ),o=t*s-e*a,r=t*a+e*s;t=o,e=r}return{x:t,y:e,z:i}}_calculateLighting(t,e,i){const r=Math.sqrt(.99),n=.5/r,c=.7/r,l=.5/r;let u=t*n+e*c+i*l;return u=Math.max(0,u)*.7+.3,u}_applyLighting(t,e){if(!t||typeof t!="string"||!t.startsWith("#"))return t;const i=t.replace("#",""),s=parseInt(i.substring(0,2),16),a=parseInt(i.substring(2,4),16),o=parseInt(i.substring(4,6),16),r=Math.round(s*e),n=Math.round(a*e),c=Math.round(o*e);return`rgb(${r}, ${n}, ${c})`}draw(){if(super.draw(),!this.camera){this.color&&m.shapes.fillRect(-this.planeWidth/2,-this.planeHeight/2,this.planeWidth,this.planeHeight,this.color);return}const t=this.selfRotationX!==0||this.selfRotationY!==0||this.selfRotationZ!==0,e=this.vertices.map(h=>{let d=h.x,g=h.y,v=h.z,_=h.nx,b=h.ny,y=h.nz;if(t){const P=this._applySelfRotation(d,g,v);d=P.x,g=P.y,v=P.z;const D=this._applySelfRotation(_,b,y);_=D.x,b=D.y,y=D.z}const M=this.camera.project(d+this.x,g+this.y,v+this.z);if(this.camera.rotationZ!==0){const P=Math.cos(this.camera.rotationZ),D=Math.sin(this.camera.rotationZ),E=_,z=b;_=E*P-z*D,b=E*D+z*P}const x=Math.cos(this.camera.rotationY),w=Math.sin(this.camera.rotationY),S=_*x-y*w,C=_*w+y*x,T=Math.cos(this.camera.rotationX),R=Math.sin(this.camera.rotationX),A=b*T-C*R,I=b*R+C*T;return{...M,nx:S,ny:A,nz:I,u:h.u,v:h.v}}),i=(e[0].nz+e[1].nz+e[2].nz+e[3].nz)/4;if(!this.doubleSided&&i>.1||((e[0].z+e[1].z+e[2].z+e[3].z)/4,e.some(h=>h.z<-this.camera.perspective+10)))return;if(this.useShader&&!this.debug){const h=e.map(I=>I.x),d=e.map(I=>I.y),g=Math.min(...h),v=Math.max(...h),_=Math.min(...d),b=Math.max(...d),y=v-g,M=b-_,x=(g+v)/2,w=(_+b)/2,S=m.ctx,C=S.getTransform(),T=C.e,R=C.f;S.save(),S.setTransform(1,0,0,1,0,0);const A=this._renderWithShader(S,T+x,R+w,y,M);if(S.restore(),A)return}const a=m.ctx;let o=(e[0].nx+e[1].nx+e[2].nx+e[3].nx)/4,r=(e[0].ny+e[1].ny+e[2].ny+e[3].ny)/4,n=o,c=r,l=i;this.doubleSided&&i>0&&(n=-o,c=-r,l=-i);const u=this._calculateLighting(n,c,l);for(const h of this.faces){const d=e[h[0]],g=e[h[1]],v=e[h[2]];if(this.debug)a.beginPath(),a.moveTo(d.x,d.y),a.lineTo(g.x,g.y),a.lineTo(v.x,v.y),a.closePath(),this.stroke&&(a.strokeStyle=this.stroke,a.lineWidth=this.lineWidth??1,a.stroke());else if(this.texture)this._renderTexturedTriangle(a,d,g,v);else if(this.color){const _=this._applyLighting(this.color,u);a.beginPath(),a.moveTo(d.x,d.y),a.lineTo(g.x,g.y),a.lineTo(v.x,v.y),a.closePath(),a.fillStyle=_,a.fill()}}}_renderTexturedTriangle(t,e,i,s){if(!this.texture||!this.texture.complete)return;const a=this.texture,o=a.width,r=a.height,n=e.u*o,c=e.v*r,l=i.u*o,u=i.v*r,h=s.u*o,d=s.v*r,g=e.x,v=e.y,_=i.x,b=i.y,y=s.x,M=s.y,x=(l-n)*(d-c)-(h-n)*(u-c);if(Math.abs(x)<1e-4)return;const w=((_-g)*(d-c)-(y-g)*(u-c))/x,S=((y-g)*(l-n)-(_-g)*(h-n))/x,C=g-w*n-S*c,T=((b-v)*(d-c)-(M-v)*(u-c))/x,R=((M-v)*(l-n)-(b-v)*(h-n))/x,A=v-T*n-R*c;t.save(),t.beginPath(),t.moveTo(g,v),t.lineTo(_,b),t.lineTo(y,M),t.closePath(),t.clip(),t.setTransform(w,T,S,R,C,A),t.drawImage(a,0,0),t.restore()}getCenter(){return{x:this.x,y:this.y,z:this.z}}getBounds(){return{x:this.x-this.planeWidth/2,y:this.y-this.planeHeight/2,width:this.planeWidth,height:this.planeHeight}}};k(Be,"_glRenderer",null);k(Be,"_glRendererSize",{width:0,height:0});class fi extends te{constructor(t,e={}){super(e),this._text=t,this._font=e.font||"12px monospace",this._color=e.color||"yellow",this._align=e.align||"center",this._baseline=e.baseline||"middle",this._calculateBounds(),this._calculateAlignmentOffsets()}draw(){super.draw(),this.logger.log("draw",this.font,this.color,this.opacity),m.text.setFont(this.font),m.text.setTextAlign(this.align),m.text.setTextBaseline(this.baseline),m.text.fillText(this.text,0,0,this.color)}_calculateAlignmentOffsets(){if(!m.text)return;const t=m.text.measureTextDimensions(this.text,this.font);switch(this._align){case"left":this._centerOffsetX=t.width/2;break;case"center":this._centerOffsetX=0;break;case"right":this._centerOffsetX=-t.width/2-5;break}switch(this._baseline){case"top":this._centerOffsetY=t.height/4;break;case"middle":this._centerOffsetY=-2;break;case"bottom":this._centerOffsetY=-t.height;break}}getTextBounds(){if(m.text){const t=m.text.measureTextDimensions(this.text,this.font),e=2;return{x:this._centerOffsetX-t.width/2,y:this._centerOffsetY-t.height/2,width:t.width+e*2,height:t.height+e*2}}return{x:this._centerOffsetX,y:this._centerOffsetY,width:this._width,height:this._height}}_calculateBounds(){if(m.text){const t=m.text.measureTextDimensions(this.text,this.font);this._width=t.width,this._height=t.height,this._calculateAlignmentOffsets()}else this._width=this.text?this.text.length*8:0,this._height=16;this.trace("TextShape.calculateBounds: "+this._width+"x"+this._height)}getDebugBounds(){const t=this.getTextBounds();return{x:t.x,y:t.y,width:t.width,height:t.height}}checkDirty(t,e){t!==e&&(this._boundsDirty=!0,this._calculateBounds())}get text(){return this._text}set text(t){this.checkDirty(t,this._text),this._text=t}get font(){return this._font}set font(t){this.checkDirty(t,this._font),this._font=t}get color(){return this._color}set color(t){this._color=t}get align(){return this._align}set align(t){this.checkDirty(t,this._align),this._align=t}get baseline(){return this._baseline}set baseline(t){this.checkDirty(t,this._baseline),this._baseline=t}}class de extends te{constructor(t,e={}){if(!t&&!e.width&&!e.height)throw new Error("ImageShape must be initialized with either a bitmap or width and height");super(e),this._bitmap=t??m.img.createImageData(e.width,e.height),this._width=e.width??(t==null?void 0:t.width)??0,this._height=e.height??(t==null?void 0:t.height)??0,this.anchor=e.anchor??"center",this._anchorX=.5,this._anchorY=.5,this._updateAnchorOffsets(),this.smoothing=e.smoothing!==!1,t instanceof ImageData&&this.buffer(t)}_updateAnchorOffsets(){var t;const e=((t=this.anchor)==null?void 0:t.toLowerCase())??"center";e.includes("left")?this._anchorX=0:e.includes("right")?this._anchorX=1:this._anchorX=.5,e.includes("top")?this._anchorY=0:e.includes("bottom")?this._anchorY=1:this._anchorY=.5}get bitmap(){return this._bitmap}set bitmap(t){t&&(this._bitmap=t,!this._width&&t.width&&(this._width=t.width),!this._height&&t.height&&(this._height=t.height),t instanceof ImageData&&this.buffer(t))}buffer(t){if(!t)return;this._buffer||(this._buffer=document.createElement("canvas")),(this._buffer.width!==t.width||this._buffer.height!==t.height)&&(this._buffer.width=t.width,this._buffer.height=t.height),this._buffer.getContext("2d").putImageData(t,0,0)}reset(){this._buffer=null,this._bitmap=m.img.createImageData(this.width,this.height)}setAnchor(t){this.anchor=t,this._updateAnchorOffsets()}draw(){if(!this.visible||!this._bitmap&&!this._buffer)return;super.draw();let t=this._bitmap instanceof ImageData?this._buffer:this._bitmap;(!t||this._bitmap instanceof ImageData&&!this._buffer)&&(this._bitmap instanceof ImageData&&(this.buffer(this._bitmap),t=this._buffer),!t)||m.img.draw(t,0,0,{width:this.width,height:this.height,anchor:this.anchor,rotation:this.rotation,scaleX:this.scaleX,scaleY:this.scaleY,alpha:this.opacity,smoothing:this.smoothing,flipX:this.scaleX<0,flipY:this.scaleY<0})}calculateBounds(){return{x:-this._anchorX*this.width,y:-this._anchorY*this.height,width:this.width,height:this.height}}}class ze{constructor(){this.listeners={}}on(t,e){this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)}off(t,e){this.listeners[t]&&(this.listeners[t]=this.listeners[t].filter(i=>i!==e))}emit(t,e){this.listeners[t]&&this.listeners[t].forEach(i=>i(e))}}class L{static init(t){L.game=t,L.x=0,L.y=0,L.down=!1,t.events.on("mousedown",e=>L._onDown(e,t)),t.events.on("mouseup",e=>L._onUp(e,t)),t.events.on("mousemove",e=>L._onMove(e,t)),t.events.on("touchstart",e=>L._onTouchStart(e,t)),t.events.on("touchend",e=>L._onTouchEnd(e,t)),t.events.on("touchmove",e=>L._onTouchMove(e,t))}static _scaleToCanvas(t,e,i){const s=t.canvas,a=s.getBoundingClientRect(),o=s.width/a.width,r=s.height/a.height;return{x:e*o,y:i*r}}static _setPosition(t,e){L.x=t,L.y=e}static _onDown(t,e){L.down=!0;const i=L._scaleToCanvas(e,t.offsetX,t.offsetY);L._setPosition(i.x,i.y),Object.defineProperty(t,"x",{value:i.x,configurable:!0}),Object.defineProperty(t,"y",{value:i.y,configurable:!0}),e.events.emit("inputdown",t)}static _onUp(t,e){L.down=!1;const i=L._scaleToCanvas(e,t.offsetX,t.offsetY);L._setPosition(i.x,i.y),Object.defineProperty(t,"x",{value:i.x,configurable:!0}),Object.defineProperty(t,"y",{value:i.y,configurable:!0}),e.events.emit("inputup",t)}static _onMove(t,e){const i=L._scaleToCanvas(e,t.offsetX,t.offsetY);L._setPosition(i.x,i.y),Object.defineProperty(t,"x",{value:i.x,configurable:!0}),Object.defineProperty(t,"y",{value:i.y,configurable:!0}),e.events.emit("inputmove",t)}static _onTouchStart(t,e){const i=t.touches[0],s=e.canvas.getBoundingClientRect();L.down=!0;const a=i.clientX-s.left,o=i.clientY-s.top,r=L._scaleToCanvas(e,a,o);L._setPosition(r.x,r.y),Object.defineProperty(t,"x",{value:r.x,configurable:!0}),Object.defineProperty(t,"y",{value:r.y,configurable:!0}),e.events.emit("inputdown",t)}static _onTouchEnd(t,e){L.down=!1,e.events.emit("inputup",t)}static _onTouchMove(t,e){const i=t.touches[0],s=e.canvas.getBoundingClientRect(),a=i.clientX-s.left,o=i.clientY-s.top,r=L._scaleToCanvas(e,a,o);L._setPosition(r.x,r.y),Object.defineProperty(t,"x",{value:r.x,configurable:!0}),Object.defineProperty(t,"y",{value:r.y,configurable:!0}),e.events.emit("inputmove",t)}}const G=class tt{static init(t){tt._gameMap.set(t.canvas,t),tt.game=t,tt.canvas=t.canvas,tt.x=0,tt.y=0,tt.leftDown=!1,tt.middleDown=!1,tt.rightDown=!1,t.canvas.addEventListener("mousemove",tt._onMove),t.canvas.addEventListener("mousedown",tt._onDown),t.canvas.addEventListener("mouseup",tt._onUp),t.canvas.addEventListener("click",tt._onClick),t.canvas.addEventListener("wheel",tt._onWheel)}static _getGameForEvent(t){const e=t.currentTarget;return tt._gameMap.get(e)||tt.game}static _updatePosition(t,e){const i=e.canvas,s=i.getBoundingClientRect(),a=t.clientX-s.left,o=t.clientY-s.top,r=i.width/s.width,n=i.height/s.height;tt.x=a*r,tt.y=o*n}};k(G,"_gameMap",new Map);k(G,"_onMove",f=>{const t=G._getGameForEvent(f);G._updatePosition(f,t),t.events.emit("mousemove",f)});k(G,"_onDown",f=>{const t=G._getGameForEvent(f);G._updatePosition(f,t),f.button===0&&(G.leftDown=!0),f.button===1&&(G.middleDown=!0),f.button===2&&(G.rightDown=!0),t.events.emit("mousedown",f)});k(G,"_onUp",f=>{const t=G._getGameForEvent(f);G._updatePosition(f,t),f.button===0&&(G.leftDown=!1),f.button===1&&(G.middleDown=!1),f.button===2&&(G.rightDown=!1),t.events.emit("mouseup",f)});k(G,"_onClick",f=>{const t=G._getGameForEvent(f);G._updatePosition(f,t),f.canvasX=G.x,f.canvasY=G.y,Object.defineProperty(f,"x",{value:G.x,writable:!1}),Object.defineProperty(f,"y",{value:G.y,writable:!1}),t.events.emit("click",f)});k(G,"_onWheel",f=>{const t=G._getGameForEvent(f);G._updatePosition(f,t),t.events.emit("wheel",f)});let di=G;const B=class st{static init(t){st.game=t,window.addEventListener("keydown",st._onKeyDown),window.addEventListener("keyup",st._onKeyUp)}static isDown(t){return st._down.has(t)}static _onKeyDown(t){const e=st._codeMap[t.code];e&&(st._down.has(e)||(st._down.add(e),st.game.events.emit(e,t))),st.game.events.emit(t.type,t)}static _onKeyUp(t){const e=st._codeMap[t.code];e&&st._down.has(e)&&(st._down.delete(e),st.game.events.emit(e+"_up",t)),st.game.events.emit(t.type,t)}};k(B,"W","W");k(B,"A","A");k(B,"S","S");k(B,"D","D");k(B,"Q","Q");k(B,"E","E");k(B,"R","R");k(B,"F","F");k(B,"Z","Z");k(B,"C","C");k(B,"UP","UP");k(B,"DOWN","DOWN");k(B,"LEFT","LEFT");k(B,"RIGHT","RIGHT");k(B,"SPACE","SPACE");k(B,"SHIFT","SHIFT");k(B,"ENTER","ENTER");k(B,"ESC","ESC");k(B,"_codeMap",{KeyW:B.W,KeyA:B.A,KeyS:B.S,KeyD:B.D,KeyQ:B.Q,KeyE:B.E,KeyR:B.R,KeyF:B.F,KeyZ:B.Z,KeyC:B.C,ArrowUp:B.UP,ArrowDown:B.DOWN,ArrowLeft:B.LEFT,ArrowRight:B.RIGHT,Space:B.SPACE,ShiftLeft:B.SHIFT,ShiftRight:B.SHIFT,Enter:B.ENTER,NumpadEnter:B.ENTER,Escape:B.ESC});k(B,"_down",new Set);k(B,"game",null);let mi=B;const dt=class at{static init(t){at._gameMap.set(t.canvas,t),at.game=t,at.canvas=t.canvas,at.x=0,at.y=0,at.active=!1,t.canvas.addEventListener("touchstart",at._onStart),t.canvas.addEventListener("touchend",at._onEnd),t.canvas.addEventListener("touchmove",at._onMove)}static _getGameForEvent(t){const e=t.currentTarget;return at._gameMap.get(e)||at.game}static _updatePosition(t,e){const i=e.canvas,s=i.getBoundingClientRect(),a=t.clientX-s.left,o=t.clientY-s.top,r=i.width/s.width,n=i.height/s.height;at.x=a*r,at.y=o*n}};k(dt,"_gameMap",new Map);k(dt,"_onStart",f=>{if(f.touches.length>0){const t=dt._getGameForEvent(f);dt.active=!0,dt._updatePosition(f.touches[0],t),t.events.emit("touchstart",f)}});k(dt,"_onEnd",f=>{const t=dt._getGameForEvent(f);dt.active=!1,t.events.emit("touchend",f)});k(dt,"_onMove",f=>{if(f.touches.length>0){const t=dt._getGameForEvent(f);dt._updatePosition(f.touches[0],t),t.events.emit("touchmove",f)}});let gi=dt;function pi(f,t={}){var e;if(!f||!(f instanceof Gt))return console.warn("applyAnchor can only be applied to GameObject instances"),f;f._anchor={position:t.anchor??null,margin:t.anchorMargin??10,offsetX:t.anchorOffsetX??0,offsetY:t.anchorOffsetY??0,relative:t.anchorRelative??!1,setTextAlign:t.anchorSetTextAlign!==!1,lastUpdate:0};const i=(e=f.update)==null?void 0:e.bind(f);f.update=function(a){const o=f._anchor.relative===!0&&f.parent?f.parent:f._anchor.relative;if(f._anchor.position&&(f.boundsDirty||o&&o.boundsDirty||f.parent&&f.parent.boundsDirty)){let r;if(o){const l={x:o.x,y:o.y,width:o.width,height:o.height};r=we.calculate(f._anchor.position,f,l,f._anchor.margin,f._anchor.offsetX,f._anchor.offsetY)}else r=we.calculateAbsolute(f._anchor.position,f,f.game,f._anchor.margin,f._anchor.offsetX,f._anchor.offsetY);let n,c;f.parent&&!s(f)?o===f.parent?(n=r.x-o.x,c=r.y-o.y):(n=r.x-f.parent.x,c=r.y-f.parent.y):(n=r.x,c=r.y),f.transform&&typeof f.transform.position=="function"?f.transform.position(n,c):(f.x=n,f.y=c),f._anchor.setTextAlign&&("align"in f&&(f.align=r.align),"baseline"in f&&(f.baseline=r.baseline)),f._anchor.lastUpdate=f.game?f.game.lastTime:Date.now()}i&&i(a)};function s(a){return a.game&&a.game.pipeline&&a.game.pipeline.gameObjects&&a.game.pipeline.gameObjects.includes(a)}return f}class Gt extends re{constructor(t,e={}){super(e),this.game=t,this.parent=null,this.events=new ze,this._interactive=e.interactive??!1,this._hovered=!1,e.anchor&&pi(this,e)}update(t){this.logger.groupCollapsed("GameObject.update: "+(this.name==null?this.constructor.name:this.name)),super.update(t),this.logger.groupEnd()}get interactive(){return this._interactive}set interactive(t){const e=!!t;this._interactive!==e&&(this._interactive=e,e===!0?this._enableEvents():(this._disableEvents(),this._hovered&&(this._hovered=!1,this.events.emit("mouseout"))))}_enableEvents(){this.logger.log(`${this.constructor.name} is now interactive`)}_disableEvents(){this.logger.log(`${this.constructor.name} is no longer interactive`)}get hovered(){return this._hovered}set hovered(t){this._hovered=!!t}_setHovered(t){this._hovered=!!t}_hitTest(t,e){var i;if(!this._interactive)return!1;const s=(i=this.getBounds)==null?void 0:i.call(this);if(!s)return!1;let a=t,o=e;const r=[];let n=this;for(;n;)r.unshift(n),n=n.parent;for(const u of r){if(a-=u.x||0,o-=u.y||0,u.rotation){const h=Math.cos(-u.rotation),d=Math.sin(-u.rotation),g=a;a=g*h-o*d,o=g*d+o*h}u.scaleX!==void 0&&u.scaleX!==0&&(a/=u.scaleX),u.scaleY!==void 0&&u.scaleY!==0&&(o/=u.scaleY)}const c=(s.width||this.width||0)/2,l=(s.height||this.height||0)/2;return a>=-c&&a<=c&&o>=-l&&o<=l}on(t,e){this.events.on(t,e)}off(t,e){this.events.off(t,e)}emit(t,...e){this.events.emit(t,...e)}}class vi extends Gt{constructor(t,e,i={}){if(super(t,i),!e||e==null||e==null)throw new Error("GameObjectShapeWrapper requires a shape");this.shape=e,i.color!==void 0&&(e.color=i.color),i.stroke!==void 0&&(e.stroke=i.stroke),i.lineWidth!==void 0&&(e.lineWidth=i.lineWidth),i.lineJoin!==void 0&&(e.lineJoin=i.lineJoin),i.lineCap!==void 0&&(e.lineCap=i.lineCap),i.miterLimit!==void 0&&(e.miterLimit=i.miterLimit),this.syncPropertiesToShape(),this.logger.log(`Created GameObject(${this.constructor.name}):`,{x:this.x,y:this.y,width:this.width,height:this.height,color:this.color,stroke:this.stroke})}syncPropertiesToShape(){if(!this.shape)return;const t=["width","height","rotation","scaleX","scaleY","visible","debug","debugColor"];for(const e of t)e in this&&e in this.shape&&this[e]!==this.shape[e]&&(this.shape[e]=this[e])}get color(){return this.shape?this.shape.color:null}set color(t){this.shape&&(this.shape.color=t)}get stroke(){return this.shape?this.shape.stroke:null}set stroke(t){this.shape&&(this.shape.stroke=t)}get lineWidth(){return this.shape?this.shape.lineWidth:1}set lineWidth(t){this.shape&&(this.shape.lineWidth=t)}get lineJoin(){return this.shape?this.shape.lineJoin:"miter"}set lineJoin(t){this.shape&&(this.shape.lineJoin=t)}get lineCap(){return this.shape?this.shape.lineCap:"butt"}set lineCap(t){this.shape&&(this.shape.lineCap=t)}get miterLimit(){return this.shape?this.shape.miterLimit:10}set miterLimit(t){this.shape&&(this.shape.miterLimit=t)}update(t){var e;this.active&&((e=this.onUpdate)==null||e.call(this,t),(this._boundsDirty||this.tweening)&&(this.syncPropertiesToShape(),this._boundsDirty=!1),super.update(t))}draw(){super.draw(),this.shape.render()}}class ee extends Gt{constructor(t,e={}){super(t,e),this._collection=new ye({sortByZIndex:e.sortByZIndex||!0}),this._collection._owner=this,this._width=e.width??0,this._height=e.height??0,this.forceWidth=null,this.forceHeight=null,this._naturalWidth=null,this._naturalHeight=null,this.userDefinedDimensions=!1,e.width!=null&&e.height!=null&&(this.userDefinedWidth=e.width,this.userDefinedHeight=e.height,this.userDefinedDimensions=!0)}update(t){this.logger.groupCollapsed("Scene.update: "+(this.name==null?this.constructor.name:this.name));for(let e=0;e<this.children.length;e++){const i=this.children[e];i.active&&i.update&&i.update(t)}super.update(t),this.logger.groupEnd()}add(t){if(t==null||t==null)throw new Error("GameObject is null or undefined");return t.parent!=null&&console.warn("This GameObject already has a parent. Consider removing it first."),t.parent=this,this._collection.add(t),this.markBoundsDirty(),t.init&&t.init(),t}markBoundsDirty(){super.markBoundsDirty(),this.children.forEach(t=>{t.markBoundsDirty()})}remove(t){const e=this._collection.remove(t);return e&&(t.parent=null,this.markBoundsDirty()),e}draw(){super.draw(),this.logger.log("Scene.draw chilren:"),this._collection.getSortedChildren().filter(t=>t.visible).map(function(t){return m.save(),t.render(),m.restore(),t})}getDebugBounds(){return{width:this.width,height:this.height,x:-this.width/2,y:-this.height/2}}getBounds(){return{x:this.x,y:this.y,width:this._width||0,height:this._height||0}}bringToFront(t){return this._collection.bringToFront(t)}sendToBack(t){return this._collection.sendToBack(t)}bringForward(t){return this._collection.bringForward(t)}sendBackward(t){return this._collection.sendBackward(t)}clear(){return this._collection.children.forEach(t=>this.remove(t)),this._collection.clear()}get children(){return this._collection.children}}class _i extends Gt{constructor(t,e={}){super(t,e),this._frames=[],this._currentFrame=0,this._frameAccumulator=0,this._isPlaying=e.autoPlay||!1,this._loop=e.loop!==void 0?e.loop:!0,this._frameRate=e.frameRate||12,this._frameDuration=1/this._frameRate,this._animations=new Map,this._currentAnimation=null,e.frames&&Array.isArray(e.frames)&&e.frames.forEach(i=>this.addFrame(i))}addAnimation(t,e,i={}){if(!t||typeof t!="string")throw new Error("Sprite.addAnimation: name is required");if(!e||!Array.isArray(e)||e.length===0)throw new Error("Sprite.addAnimation: frames array is required");return e.forEach(s=>{s.parent=this}),this._animations.set(t,{frames:e,loop:i.loop!==void 0?i.loop:!0,frameRate:i.frameRate||null}),this}removeAnimation(t){const e=this._animations.get(t);return e?(e.frames.forEach(i=>{i.parent=null}),this._animations.delete(t),this._currentAnimation===t&&(this._currentAnimation=null,this._frames=[]),!0):!1}playAnimation(t,e=!1){const i=this._animations.get(t);return i?this._currentAnimation===t&&this._isPlaying&&!e?this:(this._currentAnimation=t,this._frames=i.frames,this._loop=i.loop,i.frameRate!==null&&(this._frameRate=i.frameRate,this._frameDuration=1/this._frameRate),this._currentFrame=0,this._frameAccumulator=0,this._isPlaying=!0,this):(console.warn(`Sprite.playAnimation: animation '${t}' not found`),this)}stopAnimation(t){const e=this._animations.get(t);return e?(this._currentAnimation=t,this._frames=e.frames,this._loop=e.loop,this._currentFrame=0,this._frameAccumulator=0,this._isPlaying=!1,this):(console.warn(`Sprite.stopAnimation: animation '${t}' not found`),this)}get currentAnimationName(){return this._currentAnimation}get animationNames(){return Array.from(this._animations.keys())}hasAnimation(t){return this._animations.has(t)}addFrame(t){if(!t)throw new Error("Sprite.addFrame: shape is required");return t.parent=this,this._frames.push(t),this.markBoundsDirty(),this._frames.length-1}removeFrame(t){if(t<0||t>=this._frames.length)return null;const e=this._frames.splice(t,1)[0];return e&&(e.parent=null,this.markBoundsDirty(),this._currentFrame>=this._frames.length&&this._frames.length>0&&(this._currentFrame=this._frames.length-1)),e}clearFrames(){this._frames.forEach(t=>{t.parent=null}),this._frames=[],this._currentFrame=0,this.markBoundsDirty()}get totalFrames(){return this._frames.length}get currentFrame(){return this._currentFrame}get currentShape(){return this._frames[this._currentFrame]||null}get frames(){return this._frames}get isPlaying(){return this._isPlaying}get loop(){return this._loop}set loop(t){this._loop=t}get frameRate(){return this._frameRate}set frameRate(t){if(t<=0)throw new Error("Sprite.frameRate must be greater than 0");this._frameRate=t,this._frameDuration=1/t}play(){return this._isPlaying=!0,this}pause(){return this._isPlaying=!1,this}stop(){return this._isPlaying=!1,this._currentFrame=0,this._frameAccumulator=0,this}rewind(){return this._currentFrame=0,this._frameAccumulator=0,this}goto(t){return this._frames.length===0?this:(this._currentFrame=Math.max(0,Math.min(t,this._frames.length-1)),this._frameAccumulator=0,this)}gotoAndStop(t){return this.goto(t),this.pause(),this}gotoAndPlay(t){return this.goto(t),this.play(),this}update(t){if(super.update(t),!this._isPlaying||this._frames.length===0)return;for(this._frameAccumulator+=t;this._frameAccumulator>=this._frameDuration;)this._frameAccumulator-=this._frameDuration,this._advanceFrame();const e=this.currentShape;e&&typeof e.update=="function"&&e.update(t)}_advanceFrame(){this._currentFrame++,this._currentFrame>=this._frames.length&&(this._loop?this._currentFrame=0:(this._currentFrame=this._frames.length-1,this._isPlaying=!1))}draw(){super.draw();const t=this.currentShape;t&&t.visible!==!1&&(m.save(),t.render(),m.restore())}calculateBounds(){if(this._frames.length===0)return{x:this.x,y:this.y,width:0,height:0};let t=1/0,e=1/0,i=-1/0,s=-1/0;return this._frames.forEach(a=>{const o=a.getBounds();t=Math.min(t,o.x),e=Math.min(e,o.y),i=Math.max(i,o.x+o.width),s=Math.max(s,o.y+o.height)}),{x:t+this.x,y:e+this.y,width:i-t,height:s-e}}toString(){return`[Sprite frames=${this.totalFrames} current=${this.currentFrame} playing=${this.isPlaying}]`}}class Xe extends _i{constructor(t,e={}){super(t,{frameRate:e.frameRate||12,loop:e.loop!==void 0?e.loop:!0,autoPlay:!1,...e}),this._src=e.src,this._frameWidth=e.frameWidth,this._frameHeight=e.frameHeight,this._columns=e.columns,this._rows=e.rows,this._frameCount=e.frameCount||e.columns*e.rows,this._startFrame=e.startFrame||0,this._smoothing=e.smoothing!==void 0?e.smoothing:!1,this._autoPlayAfterLoad=e.autoPlay||!1,this._loaded=!1,this._loading=!1,this._image=null,this._frameCanvases=[],this.width=this._frameWidth,this.height=this._frameHeight}static async create(t,e){const i=new Xe(t,e);return await i.load(),i}async load(){if(this._loaded||this._loading)return this;this._loading=!0;try{return this._image=await this._loadImage(this._src),await this._sliceFrames(),this._loaded=!0,this._loading=!1,this._autoPlayAfterLoad&&this.play(),this}catch(t){throw this._loading=!1,console.error("SpriteSheet.load failed:",t),t}}_loadImage(t){return new Promise((e,i)=>{const s=new Image;s.onload=()=>e(s),s.onerror=a=>i(new Error(`Failed to load image: ${t}`)),s.src=t})}async _sliceFrames(){const{_image:t,_frameWidth:e,_frameHeight:i,_columns:s}=this;this.clearFrames(),this._frameCanvases=[];for(let a=this._startFrame;a<this._startFrame+this._frameCount;a++){const o=a%s,r=Math.floor(a/s),n=o*e,c=r*i,l=document.createElement("canvas");l.width=e,l.height=i;const u=l.getContext("2d");u.imageSmoothingEnabled=this._smoothing,u.drawImage(t,n,c,e,i,0,0,e,i),this._frameCanvases.push(l);const h=new de(l,{width:e,height:i,anchor:"center",smoothing:this._smoothing});this.addFrame(h)}}get loaded(){return this._loaded}get loading(){return this._loading}get frameWidth(){return this._frameWidth}get frameHeight(){return this._frameHeight}get columns(){return this._columns}get rows(){return this._rows}update(t){this._loaded&&super.update(t)}draw(){this._loaded&&super.draw()}toString(){return`[SpriteSheet src="${this._src}" frames=${this._frameCount} loaded=${this._loaded}]`}}class Di extends vi{constructor(t,e,i={}){const s=e instanceof de?e:new de(e,i);super(t,s,i)}reset(){this.shape.reset()}}class Nt{static lerp(t,e,i){return t+(e-t)*i}static lerpAngle(t,e,i){let s=e-t;for(;s<-Math.PI;)s+=Math.PI*2;for(;s>Math.PI;)s-=Math.PI*2;return t+s*i}static tweenColor(t,e,i){return t.map((s,a)=>Nt.lerp(s,e[a],i))}static tweenGradient(t,e,i){let s=t[0],a=e[0];Math.abs(a-s)>180&&(s<a?s+=360:a+=360);const o=Nt.lerp(s,a,i)%360,r=Nt.lerp(t[1],e[1],i),n=Nt.lerp(t[2],e[2],i);return[o,r,n]}}class xt{constructor(t,e,i,s,a={}){this.target=t,this.toProps={...e},this.duration=i,this.easingFn=s||Wt.easeOutQuad,this.delay=a.delay||0,this.onStart=a.onStart||null,this.onComplete=a.onComplete||null,this.onUpdate=a.onUpdate||null,this._elapsed=0,this._started=!1,this._finished=!1,this._startProps={};for(const o in this.toProps)o in this.target&&(this._startProps[o]=this.target[o])}static to(t,e,i,s,a){const o=new xt(t,e,i,s,a);return xt._active.push(o),o}update(t){if(this._finished||(this._elapsed+=t,this._elapsed<this.delay))return;const e=this._elapsed-this.delay,i=Math.min(e/this.duration,1);!this._started&&i>0&&(this._started=!0,this.onStart&&this.onStart());const s=this.easingFn(i);for(const a in this._startProps){const o=this._startProps[a],r=this.toProps[a];this.target[a]=Nt.lerp(o,r,s)}this.onUpdate&&this.onUpdate(),i>=1&&(this._finished=!0,this.onComplete&&this.onComplete())}static updateAll(t){for(const e of xt._active)e.update(t);xt._active=xt._active.filter(e=>!e._finished)}static killTarget(t){xt._active=xt._active.filter(e=>e.target!==t)}static killAll(){xt._active=[]}}class yi extends ke{constructor(t){super(),this.game=t,this._collection=new ye,this._collection._owner=this,["inputdown","inputup","inputmove","click"].forEach(i=>{this.game.events.on(i,s=>{this.dispatchInputEvent(i,s)})})}_hoverObject(t,e){if(!t.interactive||!t._hitTest)return;const i=t._hitTest(e.x,e.y);i&&!t._hovered?(t._hovered=!0,t.events.emit("mouseover",e)):!i&&t._hovered&&(t._hovered=!1,t.events.emit("mouseout",e))}_hoverScene(t,e){if(t.children&&t.children.length>0)for(let i=t.children.length-1;i>=0;i--){const s=t.children[i];s instanceof ee?this._hoverScene(s,e):this._hoverObject(s,e)}this._hoverObject(t,e)}dispatchInputEvent(t,e){var i;for(let s=this.gameObjects.length-1;s>=0;s--){const a=this.gameObjects[s];if(a instanceof ee){if(this._dispatchToScene(a,t,e))break}else if(a.interactive&&((i=a._hitTest)!=null&&i.call(a,e.x,e.y))){a.events.emit(t,e);break}}t==="inputmove"&&this._dispatchHover(e)}_dispatchHover(t){for(let e=this.gameObjects.length-1;e>=0;e--){const i=this.gameObjects[e];i instanceof ee?this._hoverScene(i,t):this._hoverObject(i,t)}}_dispatchToScene(t,e,i){var s,a;for(let o=t.children.length-1;o>=0;o--){const r=t.children[o];if(r instanceof ee){if(this._dispatchToScene(r,e,i))return!0}else if(r.interactive&&((s=r._hitTest)!=null&&s.call(r,i.x,i.y)))return r.events.emit(e,i),!0}return t.interactive&&((a=t._hitTest)!=null&&a.call(t,i.x,i.y))?(t.events.emit(e,i),!0):!1}add(t){t.parent=this.game;const e=this._collection.add(t);return e.init&&e.init(),e}remove(t){if(t==null){this.logger.warn("Cannot remove undefined or null object",t);return}this._collection.remove(t)}bringToFront(t){return this._collection.bringToFront(t)}sendToBack(t){return this._collection.sendToBack(t)}bringForward(t){return this._collection.bringForward(t)}sendBackward(t){return this._collection.sendBackward(t)}clear(){return this._collection.clear()}get gameObjects(){return this._collection.children}update(t){this.logger.groupCollapsed("Pipeline.update"),this._collection.children.filter(e=>e.active).forEach(e=>e.update(t)),xt.updateAll(t),this.logger.groupEnd()}render(){const t=s=>s.render(),e=s=>s.visible,i=s=>s.active;this.logger.groupCollapsed("Pipeline.render"),this._collection.getSortedChildren().filter(e).filter(i).forEach(t),this.logger.groupEnd()}}class Ii{constructor(t){Y(this,ie,0),Y(this,se,0),this.canvas=t,this.ctx=t.getContext("2d"),this.events=new ze,this._cursor=null,this.lastTime=0,this.dt=0,this.running=!1,this._frame=0,this.pipeline=new yi(this),m.init(this.ctx),this.targetFPS=60,this._frameInterval=1e3/this.targetFPS,this._accumulator=0,this._pauseOnBlur=!1,this._isPaused=!1,this._init=!1,this.initLogging()}setFPS(t){this.targetFPS=t,this._frameInterval=1e3/t}init(){this.initIO(),this.initMotion(),this._init=!0,this.logger.log("[Game] Initialized")}initMouse(){di.init(this)}initTouch(){gi.init(this)}initInput(){L.init(this)}initKeyboard(){mi.init(this)}initIO(){this.initMouse(),this.initTouch(),this.initInput(),this.initKeyboard()}initMotion(){xt._active=[]}initLogging(){this.logger=new bt("Game"),bt.setOutput(console),bt.disableAll(),bt.disable(),bt.setLevel(bt.INFO),this.logger.groupCollapsed("Initializing Game...")}enableLogging(){bt.enable()}disableLogging(){bt.disableAll(),bt.disable()}markBoundsDirty(){this._boundsDirty=!0}get boundsDirty(){return this._boundsDirty}set boundsDirty(t){this._boundsDirty=t}enableFluidSize(t=window,e={}){const{top:i=0,right:s=0,bottom:a=0,left:o=0}=e;if(t===window){const r=()=>{var n;this.canvas.width=window.innerWidth-o-s,this.canvas.height=window.innerHeight-i-a,(p(this,ie)!==this.canvas.width||p(this,se)!==this.canvas.height)&&(this.markBoundsDirty(),(n=this.onResize)==null||n.call(this)),N(this,ie,this.canvas.width),N(this,se,this.canvas.height)};r(),window.addEventListener("resize",r),this._fluidResizeCleanup=()=>{window.removeEventListener("resize",r)}}else{if(!("ResizeObserver"in window)){console.warn("ResizeObserver not supported in this browser.");return}const r=()=>{const c=t.getBoundingClientRect();this.canvas.width=c.width-o-s,this.canvas.height=c.height-i-a},n=new ResizeObserver(()=>{r()});n.observe(t),r(),this._fluidResizeCleanup=()=>n.disconnect()}}disableFluidSize(){this._fluidResizeCleanup&&(this._fluidResizeCleanup(),this._fluidResizeCleanup=null)}start(){if(this.logger.groupCollapsed("[Game] Starting..."),this.init(),!this._init)throw new Error("Game not initialized. Did you call init()? Remember to call super.init() in your subclass.");this.running=!0,this.loop=this.loop.bind(this),requestAnimationFrame(this.loop),this.logger.log("[Game] Started"),this.logger.groupEnd()}stop(){this.running=!1,this.logger.log("[Game] Stopped")}restart(){this.pipeline.clear(),this.init(),this.start(),this.logger.log("[Game] Restarted")}loop(t){if(!this.running)return;const e=t-this.lastTime;if(this.lastTime=t,this._accumulator+=e,this.actualFps=1e3/e,this._accumulator>=this._frameInterval){const i=this._frameInterval/1e3;this.dt=i,this._frame++,this.logger.groupCollapsed(`Frame #${this._frame}`),this.logger.time("render time"),this.update(i),this.render(),this.logger.timeEnd("render time"),this.logger.groupEnd(),this._accumulator-=this._frameInterval}this.boundsDirty&&(this.boundsDirty=!1),requestAnimationFrame(this.loop)}update(t){this.pipeline.update(t)}render(){m.setContext(this.ctx),this.running&&this.clear(),this.pipeline.render()}clear(){m.clear()}get width(){return this.canvas.width}get height(){return this.canvas.height}set backgroundColor(t){this.canvas.style.backgroundColor=t}set cursor(t){this._cursor&&(this._cursor.destroy(),this.pipeline.remove(this._cursor)),this._cursor=t,this._cursor.activate(),this.pipeline.add(t)}get cursor(){return this._cursor}resetCursor(){this._cursor&&(this._cursor.destroy(),this.pipeline.remove(this._cursor),this._cursor=null)}enablePauseOnBlur(t){this._pauseOnBlur=t,t?window.addEventListener("visibilitychange",this._handleVisibilityChange.bind(this),!1):window.removeEventListener("visibilitychange",this._handleVisibilityChange.bind(this),!1)}_handleVisibilityChange(){this.logger.log("Visibility change detected"),document.hidden?this._pauseOnBlur&&this.running&&(this._isPaused=!0,this.stop(),this.logger.log("Paused due to tab visibility change")):this._isPaused&&(this._isPaused=!1,this.start(),this.logger.log("Resumed after tab visibility change"))}}ie=new WeakMap;se=new WeakMap;const ft={button:{default:{bg:"rgba(0, 0, 0, 0.85)",stroke:"rgba(0, 255, 0, 0.4)",text:"#0f0"},hover:{bg:"#0f0",stroke:"#0f0",text:"#000"},pressed:{bg:"#0c0",stroke:"#0f0",text:"#000"},active:{bg:"rgba(0, 255, 0, 0.15)",stroke:"#0f0",text:"#0f0"}}};class bi extends Gt{constructor(t,e={}){super(t,e);const{x:i=0,y:s=0,width:a=120,height:o=40,text:r="Button",font:n="14px monospace",textColor:c="#000",textAlign:l="center",textBaseline:u="middle",shape:h=null,label:d=null,onClick:g=null,onHover:v=null,onPressed:_=null,onRelease:b=null,padding:y=10,colorDefaultBg:M=ft.button.default.bg,colorDefaultStroke:x=ft.button.default.stroke,colorDefaultText:w=ft.button.default.text,colorHoverBg:S=ft.button.hover.bg,colorHoverStroke:C=ft.button.hover.stroke,colorHoverText:T=ft.button.hover.text,colorPressedBg:R=ft.button.pressed.bg,colorPressedStroke:A=ft.button.pressed.stroke,colorPressedText:I=ft.button.pressed.text}=e;this.x=i,this.y=s,this.width=a,this.height=o,this.padding=y,this.textAlign=l,this.textBaseline=u,this.initColorScheme({colorDefaultBg:M,colorDefaultStroke:x,colorDefaultText:w,colorHoverBg:S,colorHoverStroke:C,colorHoverText:T,colorPressedBg:R,colorPressedStroke:A,colorPressedText:I}),this.initBackground(h),this.initLabel(r,n,c,d),this.initGroup(),this.initEvents(g,v,_,b),this.setState("default")}initColorScheme(t){this.colors={default:{bg:t.colorDefaultBg,stroke:t.colorDefaultStroke,text:t.colorDefaultText},hover:{bg:t.colorHoverBg,stroke:t.colorHoverStroke,text:t.colorHoverText},pressed:{bg:t.colorPressedBg,stroke:t.colorPressedStroke,text:t.colorPressedText}}}initBackground(t){this.bg=t??new ei({width:this.width,height:this.height,color:this.colors.default.bg,stroke:this.colors.default.stroke,lineWidth:2})}initLabel(t,e,i,s){this.label=s??new fi(t,{font:e,color:i,align:this.textAlign,baseline:this.textBaseline}),this.alignText()}alignText(){if(!this.label)return;const t=this.width/2,e=this.height/2;switch(this.textAlign){case"left":this.label.x=-t+this.padding;break;case"right":this.label.x=t-this.padding;break;case"center":default:this.label.x=0;break}switch(this.textBaseline){case"top":this.label.y=-e+this.padding;break;case"bottom":this.label.y=e-this.padding;break;case"middle":default:this.label.y=0;break}}initGroup(){this.group=new ti,this.group.add(this.bg),this.group.add(this.label)}initEvents(t,e,i,s){this.interactive=!0,this.onHover=e,this.onPressed=i,this.onRelease=s,this.on("mouseover",this.setState.bind(this,"hover")),this.on("mouseout",this.setState.bind(this,"default")),this.on("inputdown",this.setState.bind(this,"pressed")),this.on("inputup",()=>{this.state==="pressed"&&typeof t=="function"&&t(),this.setState("hover")})}setState(t){var e,i,s;if(this.state!==t)switch(this.state=t,t){case"default":this.game.cursor&&setTimeout(()=>{this.game.cursor.activate()},0),this.bg.color=this.colors.default.bg,this.bg.stroke=this.colors.default.stroke,this.label.color=this.colors.default.text,this.game.canvas.style.cursor="default",(e=this.onRelease)==null||e.call(this);break;case"hover":this.game.cursor&&this.game.cursor.deactivate(),this.bg.color=this.colors.hover.bg,this.bg.stroke=this.colors.hover.stroke,this.label.color=this.colors.hover.text,this.game.canvas.style.cursor="pointer",(i=this.onHover)==null||i.call(this);break;case"pressed":this.game.cursor&&this.game.cursor.deactivate(),this.bg.color=this.colors.pressed.bg,this.bg.stroke=this.colors.pressed.stroke,this.label.color=this.colors.pressed.text,this.game.canvas.style.cursor="pointer",(s=this.onPressed)==null||s.call(this);break}}update(t){super.update(t),this._boundsDirty&&this.alignText()}get text(){return this.label.text}set text(t){this.label.text=t,this._boundsDirty=!0}setTextAlign(t){this.textAlign=t,this.label.align=t,this._boundsDirty=!0}setTextBaseline(t){this.textBaseline=t,this.label.baseline=t,this._boundsDirty=!0}setFont(t){this.label.font=t,this._boundsDirty=!0}resize(t,e){this.width=t,this.height=e,this.bg.width=t,this.bg.height=e,this._boundsDirty=!0}getBounds(){return{x:this.x,y:this.y,width:this.width,height:this.height}}draw(){super.draw(),this.group.render()}}class Ei extends bi{constructor(t,e={}){const i=e.onClick;super(t,{...e,onClick:()=>{this.toggled=!this.toggled,typeof e.onToggle=="function"&&e.onToggle(this.toggled),typeof i=="function"&&i(),this.refreshToggleVisual()}}),this.colorActiveBg=e.colorActiveBg||ft.button.active.bg,this.colorActiveStroke=e.colorActiveStroke||ft.button.active.stroke,this.colorActiveText=e.colorActiveText||ft.button.active.text,this.toggled=!!e.startToggled,this.refreshToggleVisual()}toggle(t){this.toggled=t,this.refreshToggleVisual()}refreshToggleVisual(){this.toggled?(this.bg.fillColor=this.colorActiveBg,this.bg.strokeColor=this.colorActiveStroke,this.label.color=this.colorActiveText):(this.bg.fillColor=this.colors.default.bg,this.bg.strokeColor=this.colors.default.stroke,this.label.color=this.colors.default.text)}setState(t){super.setState(t),this.toggled&&(this.bg.fillColor=this.colorActiveBg,this.bg.strokeColor=this.colorActiveStroke,this.label.color=this.colorActiveText)}}class xi{constructor(){this.x=0,this.y=0,this.z=0,this.vx=0,this.vy=0,this.vz=0,this.size=1,this.color={r:255,g:255,b:255,a:1},this.shape="circle",this.age=0,this.lifetime=1,this.alive=!0,this.custom={}}reset(){this.x=0,this.y=0,this.z=0,this.vx=0,this.vy=0,this.vz=0,this.size=1,this.color.r=255,this.color.g=255,this.color.b=255,this.color.a=1,this.shape="circle",this.age=0,this.lifetime=1,this.alive=!0;for(const t in this.custom)delete this.custom[t]}get progress(){return this.lifetime>0?this.age/this.lifetime:1}}class Pi{constructor(t={}){this.rate=t.rate??10,this.position={x:0,y:0,z:0,...t.position},this.spread={x:0,y:0,z:0,...t.spread},this.velocity={x:0,y:0,z:0,...t.velocity},this.velocitySpread={x:0,y:0,z:0,...t.velocitySpread},this.lifetime={min:1,max:2,...t.lifetime},this.size={min:1,max:1,...t.size},this.color={r:255,g:255,b:255,a:1,...t.color},this.shape=t.shape??"circle",this.active=t.active!==!1,this._timer=0}_spread(t){return(Math.random()-.5)*2*t}_range(t,e){return t+Math.random()*(e-t)}emit(t){t.x=this.position.x+this._spread(this.spread.x),t.y=this.position.y+this._spread(this.spread.y),t.z=this.position.z+this._spread(this.spread.z),t.vx=this.velocity.x+this._spread(this.velocitySpread.x),t.vy=this.velocity.y+this._spread(this.velocitySpread.y),t.vz=this.velocity.z+this._spread(this.velocitySpread.z),t.lifetime=this._range(this.lifetime.min,this.lifetime.max),t.age=0,t.alive=!0,t.size=this._range(this.size.min,this.size.max),t.color.r=this.color.r,t.color.g=this.color.g,t.color.b=this.color.b,t.color.a=this.color.a,t.shape=this.shape}update(t){if(!this.active||this.rate<=0)return 0;this._timer+=t;const e=1/this.rate;let i=0;for(;this._timer>=e;)this._timer-=e,i++;return i}reset(){this._timer=0}}const Te={velocity:(f,t)=>{f.x+=f.vx*t,f.y+=f.vy*t,f.z+=f.vz*t},lifetime:(f,t)=>{f.age+=t,f.age>=f.lifetime&&(f.alive=!1)},gravity:(f=200)=>(t,e)=>{t.vy+=f*e},rise:(f=100)=>(t,e)=>{t.vy-=f*e},damping:(f=.98)=>(t,e)=>{t.vx*=f,t.vy*=f,t.vz*=f},fadeOut:(f,t)=>{f.color.a=Math.max(0,1-f.progress)},fadeInOut:(f,t)=>{const e=f.progress;f.color.a=e<.5?e*2:(1-e)*2},shrink:(f=0)=>(t,e)=>{t.custom._initialSize===void 0&&(t.custom._initialSize=t.size),t.size=t.custom._initialSize*(1-t.progress*(1-f))},grow:(f=2)=>(t,e)=>{t.custom._initialSize===void 0&&(t.custom._initialSize=t.size),t.size=t.custom._initialSize*(1+t.progress*(f-1))},colorOverLife:(f,t)=>(e,i)=>{const s=e.progress;e.color.r=Math.floor(f.r+(t.r-f.r)*s),e.color.g=Math.floor(f.g+(t.g-f.g)*s),e.color.b=Math.floor(f.b+(t.b-f.b)*s)},wobble:(f=10)=>(t,e)=>{t.vx+=(Math.random()-.5)*f*e,t.vy+=(Math.random()-.5)*f*e},bounds:(f,t=.8)=>(e,i)=>{e.x<f.left?(e.x=f.left,e.vx=Math.abs(e.vx)*t):e.x>f.right&&(e.x=f.right,e.vx=-Math.abs(e.vx)*t),e.y<f.top?(e.y=f.top,e.vy=Math.abs(e.vy)*t):e.y>f.bottom&&(e.y=f.bottom,e.vy=-Math.abs(e.vy)*t)},attract:(f,t=100)=>(e,i)=>{const s=f.x-e.x,a=f.y-e.y,o=(f.z??0)-e.z,r=Math.sqrt(s*s+a*a+o*o);if(r>1){const n=t*i/r;e.vx+=s*n,e.vy+=a*n,e.vz+=o*n}}};class Bi extends Gt{constructor(t,e={}){super(t,e),this.particles=[],this.pool=[],this.maxParticles=e.maxParticles??5e3,this.emitters=new Map,this.camera=e.camera??null,this.depthSort=e.depthSort??!1,this.updaters=e.updaters??[Te.velocity,Te.lifetime],this.blendMode=e.blendMode??"source-over",this.worldSpace=e.worldSpace??!1,this._particleCount=0}addEmitter(t,e){return this.emitters.set(t,e),this}removeEmitter(t){return this.emitters.delete(t),this}getEmitter(t){return this.emitters.get(t)}acquire(){return this.pool.length>0?this.pool.pop():new xi}release(t){t.reset(),this.pool.push(t)}emit(t,e){for(let i=0;i<t&&this.particles.length<this.maxParticles;i++){const s=this.acquire();e.emit(s),this.particles.push(s)}}burst(t,e){const i=typeof e=="string"?this.emitters.get(e):e;i&&this.emit(t,i)}update(t){super.update(t);for(const e of this.emitters.values())if(e.active){const i=e.update(t);this.emit(i,e)}for(let e=this.particles.length-1;e>=0;e--){const i=this.particles[e];for(const s of this.updaters)s(i,t,this);i.alive||(this.release(i),this.particles.splice(e,1))}this._particleCount=this.particles.length}render(){super.render(),this.particles.length!==0&&(this.camera&&this.depthSort?this.renderWithDepthSort():this.renderSimple())}renderSimple(){m.useCtx(t=>{t.globalCompositeOperation=this.blendMode;for(const e of this.particles)this.drawParticle(t,e,e.x,e.y,1);t.globalCompositeOperation="source-over"})}renderWithDepthSort(){const t=[];for(const e of this.particles){const i=this.camera.project(e.x,e.y,e.z);i.z<-this.camera.perspective+10||t.push({p:e,x:i.x,y:i.y,z:i.z,scale:i.scale})}t.sort((e,i)=>i.z-e.z),m.useCtx(e=>{e.globalCompositeOperation=this.blendMode;const i=this.parent&&this.parent.constructor.name==="Scene3D";!this.worldSpace&&!i&&(e.save(),e.translate(this.game.width/2,this.game.height/2));for(const s of t)this.drawParticle(e,s.p,s.x,s.y,s.scale);!this.worldSpace&&!i&&e.restore(),e.globalCompositeOperation="source-over"})}drawParticle(t,e,i,s,a){const{r:o,g:r,b:n,a:c}=e.color,l=e.size*a;if(l<.5||c<=0)return;t.fillStyle=`rgba(${Math.floor(o)},${Math.floor(r)},${Math.floor(n)},${c})`;const u=e.shape??"circle",h=l/2;t.beginPath(),u==="circle"?t.arc(i,s,h,0,Math.PI*2):u==="square"?t.rect(i-h,s-h,l,l):u==="triangle"&&(t.moveTo(i,s-h),t.lineTo(i+h,s+h),t.lineTo(i-h,s+h),t.closePath()),t.fill()}clear(){for(const t of this.particles)this.release(t);this.particles=[],this._particleCount=0}get particleCount(){return this._particleCount}get poolSize(){return this.pool.length}}class Oe{static applyADSR(t,e={}){const{attack:i=.01,decay:s=.1,sustain:a=.7,release:o=.2,startTime:r=0,duration:n=1,peakVolume:c=1}=e,l=c*a,u=Math.max(0,n-i-s);t.setValueAtTime(0,r),t.linearRampToValueAtTime(c,r+i),t.linearRampToValueAtTime(l,r+i+s),t.setValueAtTime(l,r+i+s+u),t.linearRampToValueAtTime(0,r+n+o)}static get presets(){return{pluck:{attack:.001,decay:.2,sustain:0,release:.1},pad:{attack:.5,decay:.3,sustain:.8,release:1},organ:{attack:.01,decay:0,sustain:1,release:.05},perc:{attack:.001,decay:.1,sustain:0,release:.05},string:{attack:.1,decay:.2,sustain:.7,release:.3},brass:{attack:.05,decay:.1,sustain:.8,release:.2},blip:{attack:.001,decay:.05,sustain:0,release:.02},laser:{attack:.001,decay:.15,sustain:0,release:.05},explosion:{attack:.001,decay:.3,sustain:.2,release:.5}}}}class oe{static init(t,e){N(this,F,t),N(this,kt,e)}static get ctx(){return p(this,F)}static get now(){return p(this,F).currentTime}static tone(t,e,i={}){const{type:s="sine",volume:a=.5,attack:o=.01,decay:r=.1,sustain:n=.7,release:c=.2,detune:l=0,startTime:u=p(this,F).currentTime}=i,h=p(this,F).createOscillator(),d=p(this,F).createGain();return h.type=s,h.frequency.setValueAtTime(t,u),h.detune.setValueAtTime(l,u),Oe.applyADSR(d.gain,{attack:o,decay:r,sustain:n,release:c,startTime:u,duration:e,peakVolume:a}),h.connect(d),d.connect(p(this,kt)),h.start(u),h.stop(u+e+c),h}static continuous(t={}){const{type:e="sine",frequency:i=440,volume:s=.5}=t,a=p(this,F).createOscillator(),o=p(this,F).createGain();a.type=e,a.frequency.value=i,o.gain.value=s,a.connect(o),o.connect(p(this,kt)),a.start();const r=p(this,F);return{osc:a,gain:o,setFrequency:(n,c=0)=>{c>0?a.frequency.linearRampToValueAtTime(n,r.currentTime+c):a.frequency.setValueAtTime(n,r.currentTime)},setVolume:(n,c=0)=>{c>0?o.gain.linearRampToValueAtTime(n,r.currentTime+c):o.gain.setValueAtTime(n,r.currentTime)},stop:(n=0)=>{n>0?(o.gain.linearRampToValueAtTime(0,r.currentTime+n),a.stop(r.currentTime+n+.01)):a.stop()}}}static fm(t,e,i,s,a={}){const{volume:o=.5,startTime:r=p(this,F).currentTime}=a,n=p(this,F).createOscillator(),c=p(this,F).createOscillator(),l=p(this,F).createGain(),u=p(this,F).createGain();return c.frequency.value=e,l.gain.value=i,n.frequency.value=t,u.gain.value=o,c.connect(l),l.connect(n.frequency),n.connect(u),u.connect(p(this,kt)),u.gain.setValueAtTime(o,r),u.gain.linearRampToValueAtTime(0,r+s),c.start(r),n.start(r),c.stop(r+s+.1),n.stop(r+s+.1),{carrier:n,modulator:c,outputGain:u}}static additive(t,e,i,s={}){const{volume:a=.5,startTime:o=p(this,F).currentTime}=s,r=[],n=p(this,F).createGain();return n.gain.value=a/e.length,n.connect(p(this,kt)),n.gain.setValueAtTime(a/e.length,o),n.gain.linearRampToValueAtTime(0,o+i),e.forEach((c,l)=>{if(c>0){const u=p(this,F).createOscillator(),h=p(this,F).createGain();u.frequency.value=t*(l+1),h.gain.value=c,u.connect(h),h.connect(n),u.start(o),u.stop(o+i+.1),r.push(u)}}),r}static sweep(t,e,i,s={}){const{type:a="sine",volume:o=.5,exponential:r=!0,startTime:n=p(this,F).currentTime}=s,c=p(this,F).createOscillator(),l=p(this,F).createGain();return c.type=a,c.frequency.setValueAtTime(t,n),r&&e>0?c.frequency.exponentialRampToValueAtTime(e,n+i):c.frequency.linearRampToValueAtTime(e,n+i),l.gain.setValueAtTime(o,n),l.gain.linearRampToValueAtTime(0,n+i),c.connect(l),l.connect(p(this,kt)),c.start(n),c.stop(n+i+.01),c}static pulse(t,e,i=.5,s={}){const{volume:a=.5,startTime:o=p(this,F).currentTime}=s,r=p(this,F).createOscillator(),n=p(this,F).createOscillator(),c=p(this,F).createGain(),l=p(this,F).createGain(),u=p(this,F).createGain();return r.type="sawtooth",n.type="sawtooth",r.frequency.value=t,n.frequency.value=t,c.gain.value=.5,l.gain.value=-.5,u.gain.setValueAtTime(a,o),u.gain.linearRampToValueAtTime(0,o+e),r.connect(c),n.connect(l),c.connect(u),l.connect(u),u.connect(p(this,kt)),r.start(o),n.start(o),r.stop(o+e+.01),n.stop(o+e+.01),{osc1:r,osc2:n,output:u}}}F=new WeakMap;kt=new WeakMap;Y(oe,F,null);Y(oe,kt,null);class ne{static init(t,e){N(this,W,t),N(this,_e,e)}static get ctx(){return p(this,W)}static filter(t="lowpass",e=1e3,i=1){const s=p(this,W).createBiquadFilter();return s.type=t,s.frequency.value=e,s.Q.value=i,s}static delay(t=.3,e=.4,i=.5){const s=p(this,W).createDelay(5),a=p(this,W).createGain(),o=p(this,W).createGain(),r=p(this,W).createGain(),n=p(this,W).createGain(),c=p(this,W).createGain();return s.delayTime.value=t,a.gain.value=e,o.gain.value=i,r.gain.value=1-i,n.connect(s),n.connect(r),s.connect(a),a.connect(s),s.connect(o),o.connect(c),r.connect(c),{input:n,output:c,setTime:l=>s.delayTime.setValueAtTime(l,p(this,W).currentTime),setFeedback:l=>a.gain.setValueAtTime(l,p(this,W).currentTime),setMix:l=>{o.gain.setValueAtTime(l,p(this,W).currentTime),r.gain.setValueAtTime(1-l,p(this,W).currentTime)}}}static reverb(t=2,e=2){const i=p(this,W).createConvolver(),s=p(this,W).sampleRate,a=s*t,o=p(this,W).createBuffer(2,a,s);for(let r=0;r<2;r++){const n=o.getChannelData(r);for(let c=0;c<a;c++)n[c]=(Math.random()*2-1)*Math.pow(1-c/a,e)}return i.buffer=o,i}static distortion(t=50){const e=p(this,W).createWaveShaper(),i=t,s=44100,a=new Float32Array(s);for(let o=0;o<s;o++){const r=o*2/s-1;a[o]=(3+i)*r*20*(Math.PI/180)/(Math.PI+i*Math.abs(r))}return e.curve=a,e.oversample="4x",e}static tremolo(t=5,e=.5){const i=p(this,W).createOscillator(),s=p(this,W).createGain(),a=p(this,W).createGain();return i.frequency.value=t,s.gain.value=e*.5,a.gain.value=1-e*.5,i.connect(s),s.connect(a.gain),i.start(),{input:a,output:a,lfo:i,setRate:o=>i.frequency.setValueAtTime(o,p(this,W).currentTime),setDepth:o=>s.gain.setValueAtTime(o*.5,p(this,W).currentTime),stop:()=>i.stop()}}static compressor(t={}){const{threshold:e=-24,knee:i=30,ratio:s=12,attack:a=.003,release:o=.25}=t,r=p(this,W).createDynamicsCompressor();return r.threshold.value=e,r.knee.value=i,r.ratio.value=s,r.attack.value=a,r.release.value=o,r}static panner(t=0){const e=p(this,W).createStereoPanner();return e.pan.value=t,e}static gain(t=1){const e=p(this,W).createGain();return e.gain.value=t,e}}W=new WeakMap;_e=new WeakMap;Y(ne,W,null);Y(ne,_e,null);class wi{static white(t,e){const i=t.sampleRate*e,s=t.createBuffer(1,i,t.sampleRate),a=s.getChannelData(0);for(let r=0;r<i;r++)a[r]=Math.random()*2-1;const o=t.createBufferSource();return o.buffer=s,o}static pink(t,e){const i=t.sampleRate*e,s=t.createBuffer(1,i,t.sampleRate),a=s.getChannelData(0);let o=0,r=0,n=0,c=0,l=0,u=0,h=0;for(let g=0;g<i;g++){const v=Math.random()*2-1;o=.99886*o+v*.0555179,r=.99332*r+v*.0750759,n=.969*n+v*.153852,c=.8665*c+v*.3104856,l=.55*l+v*.5329522,u=-.7616*u-v*.016898,a[g]=(o+r+n+c+l+u+h+v*.5362)*.11,h=v*.115926}const d=t.createBufferSource();return d.buffer=s,d}static brown(t,e){const i=t.sampleRate*e,s=t.createBuffer(1,i,t.sampleRate),a=s.getChannelData(0);let o=0;for(let n=0;n<i;n++){const c=Math.random()*2-1;a[n]=(o+.02*c)/1.02,o=a[n],a[n]*=3.5}const r=t.createBufferSource();return r.buffer=s,r}}class he{static noteToFreq(t){const e=t.match(/^([A-G][#b]?)(\d+)$/);if(!e)throw new Error(`Invalid note: ${t}`);const[,i,s]=e,a=this.NOTE_FREQUENCIES[i];if(a===void 0)throw new Error(`Unknown note: ${i}`);return a*Math.pow(2,parseInt(s))}static scale(t,e="major",i=1){const s=this.noteToFreq(t),a=this.SCALES[e];if(!a)throw new Error(`Unknown scale: ${e}`);const o=[];for(let r=0;r<i;r++)for(const n of a)o.push(s*Math.pow(2,(n+r*12)/12));return o}static chord(t,e="major"){const i=this.noteToFreq(t),s=this.CHORDS[e];if(!s)throw new Error(`Unknown chord type: ${e}`);return s.map(a=>i*Math.pow(2,a/12))}static mapToScale(t,e="C4",i="pentatonic",s=2){const a=this.scale(e,i,s),o=Math.max(0,Math.min(1,t)),r=Math.floor(o*a.length)%a.length;return a[r]}static midiToFreq(t){return 440*Math.pow(2,(t-69)/12)}static freqToMidi(t){return Math.round(12*Math.log2(t/440)+69)}static randomNote(t="C4",e="pentatonic",i=2){const s=this.scale(t,e,i);return s[Math.floor(Math.random()*s.length)]}static detune(t,e){return t*Math.pow(2,e/1200)}}k(he,"NOTE_FREQUENCIES",{C:16.35,"C#":17.32,Db:17.32,D:18.35,"D#":19.45,Eb:19.45,E:20.6,F:21.83,"F#":23.12,Gb:23.12,G:24.5,"G#":25.96,Ab:25.96,A:27.5,"A#":29.14,Bb:29.14,B:30.87});k(he,"SCALES",{major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],pentatonic:[0,2,4,7,9],pentatonicMinor:[0,3,5,7,10],blues:[0,3,5,6,7,10],dorian:[0,2,3,5,7,9,10],mixolydian:[0,2,4,5,7,9,10],chromatic:[0,1,2,3,4,5,6,7,8,9,10,11],wholeTone:[0,2,4,6,8,10],diminished:[0,2,3,5,6,8,9,11]});k(he,"CHORDS",{major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8],sus2:[0,2,7],sus4:[0,5,7],major7:[0,4,7,11],minor7:[0,3,7,10],dom7:[0,4,7,10],dim7:[0,3,6,9],add9:[0,4,7,14],power:[0,7]});class Ot{static init(t,e){N(this,Qt,t),N(this,V,t.createAnalyser()),p(this,V).fftSize=2048,e.connect(p(this,V)),p(this,V).connect(t.destination),N(this,zt,new Uint8Array(p(this,V).frequencyBinCount)),N(this,Xt,new Uint8Array(p(this,V).frequencyBinCount))}static get isInitialized(){return p(this,V)!==null}static get node(){return p(this,V)}static setFFTSize(t){p(this,V)&&(p(this,V).fftSize=t,N(this,zt,new Uint8Array(p(this,V).frequencyBinCount)),N(this,Xt,new Uint8Array(p(this,V).frequencyBinCount)))}static getWaveform(){return p(this,V)?(p(this,V).getByteTimeDomainData(p(this,zt)),p(this,zt)):new Uint8Array(0)}static getFrequency(){return p(this,V)?(p(this,V).getByteFrequencyData(p(this,Xt)),p(this,Xt)):new Uint8Array(0)}static getBands(t=8){const e=this.getFrequency();if(e.length===0)return new Array(t).fill(0);const i=Math.floor(e.length/t),s=[];for(let a=0;a<t;a++){let o=0;for(let r=0;r<i;r++)o+=e[a*i+r];s.push(o/(i*255))}return s}static getAmplitude(){const t=this.getWaveform();if(t.length===0)return 0;let e=0;for(let i=0;i<t.length;i++){const s=(t[i]-128)/128;e+=s*s}return Math.sqrt(e/t.length)}static getPeakFrequency(){if(!p(this,V)||!p(this,Qt))return 0;const t=this.getFrequency();let e=0,i=0;for(let a=0;a<t.length;a++)t[a]>i&&(i=t[a],e=a);const s=p(this,Qt).sampleRate/2;return e*s/p(this,V).frequencyBinCount}static dispose(){p(this,V)&&(p(this,V).disconnect(),N(this,V,null)),N(this,zt,null),N(this,Xt,null)}}Qt=new WeakMap;V=new WeakMap;zt=new WeakMap;Xt=new WeakMap;Y(Ot,Qt,null);Y(Ot,V,null);Y(Ot,zt,null);Y(Ot,Xt,null);class xe{static init(t={}){if(p(this,Lt)){console.warn("[Synth] Already initialized");return}const{masterVolume:e=.5,sampleRate:i=44100,enableAnalyzer:s=!1}=t;try{N(this,$,new(window.AudioContext||window.webkitAudioContext)({sampleRate:i})),N(this,ot,p(this,$).createGain()),p(this,ot).gain.value=e,p(this,ot).connect(p(this,$).destination),oe.init(p(this,$),p(this,ot)),ne.init(p(this,$),p(this,ot)),s&&Ot.init(p(this,$),p(this,ot)),N(this,Lt,!0),console.log("[Synth] Audio system initialized")}catch(a){console.error("[Synth] Failed to initialize audio:",a)}}static get isInitialized(){return p(this,Lt)}static get ctx(){return p(this,$)}static get master(){return p(this,ot)}static get osc(){return oe}static get fx(){return ne}static get env(){return Oe}static get noise(){return wi}static get music(){return he}static get analyzer(){return Ot}static async resume(){p(this,$)&&p(this,$).state==="suspended"&&(await p(this,$).resume(),console.log("[Synth] Audio context resumed"))}static async suspend(){p(this,$)&&p(this,$).state==="running"&&await p(this,$).suspend()}static get now(){return p(this,$)?p(this,$).currentTime:0}static get state(){return p(this,$)?p(this,$).state:"closed"}static set volume(t){p(this,ot)&&p(this,ot).gain.setValueAtTime(Math.max(0,Math.min(1,t)),p(this,$).currentTime)}static get volume(){return p(this,ot)?p(this,ot).gain.value:0}static chain(...t){for(let e=0;e<t.length-1;e++)t[e].connect(t[e+1]);return{first:t[0],last:t[t.length-1],connectTo:e=>t[t.length-1].connect(e)}}static schedule(t,e){const i=Math.max(0,(e-this.now)*1e3);return setTimeout(t,i)}static async close(){p(this,$)&&(Ot.dispose(),await p(this,$).close(),N(this,$,null),N(this,ot,null),N(this,Lt,!1),console.log("[Synth] Audio system closed"))}}$=new WeakMap;ot=new WeakMap;Lt=new WeakMap;Y(xe,$,null);Y(xe,ot,null);Y(xe,Lt,!1);export{Mi as C,Wt as E,Ae as F,Ii as G,Di as I,gt as N,m as P,Xe as S,Ei as T,Te as U,Ci as a,Pi as b,Bi as c,pi as d,Ai as e,we as f,ki as h,Ri as t,Ti as z};
