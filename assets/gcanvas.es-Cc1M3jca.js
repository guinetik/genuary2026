var Ze=Object.defineProperty,ze=f=>{throw TypeError(f)},Ve=(f,t,e)=>t in f?Ze(f,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):f[t]=e,E=(f,t,e)=>Ve(f,typeof t!="symbol"?t+"":t,e),xe=(f,t,e)=>t.has(f)||ze("Cannot "+e),_=(f,t,e)=>(xe(f,t,"read from private field"),e?e.call(f):t.get(f)),Y=(f,t,e)=>t.has(f)?ze("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(f):t.set(f,e),N=(f,t,e,i)=>(xe(f,t,"write to private field"),t.set(f,e),e),K=(f,t,e)=>(xe(f,t,"access private method"),e),ct,we,he,z,V,Me,Nt,Se,gt,st,qt,bt,Jt,Qt,te,ee,ie,se,oe,Xt,Ot,le,ce,L,zt,G,Ce,ne,$,Wt,Gt,j,ht,Zt;class Te{constructor(t={}){this.children=[],this.sortByZIndex=t.sortByZIndex||!0,this._zOrderDirty=!1}add(t){return this.children.includes(t)?(console.warn("Object is already in this collection"),t):(this.children.push(t),t.parent=this._owner||this,this.sortByZIndex&&(this._zOrderDirty=!0,(t.zIndex===void 0||t.zIndex===null)&&(t.zIndex=this.children.length-1)),t)}remove(t){const e=this.children.indexOf(t);return e!==-1?(this.children.splice(e,1),t.parent=null,!0):!1}clear(){this.children.forEach(t=>{t.parent=null}),this.children=[]}bringToFront(t){const e=this.children.indexOf(t);if(e===-1){this.add(t);return}if(this.sortByZIndex){let i=!0;for(const s of this.children)if(s!==t&&(s.zIndex||0)>=(t.zIndex||0)){i=!1;break}i||(t.zIndex=Number.MAX_SAFE_INTEGER,this._zOrderDirty=!0,this._normalizeZIndices())}else e!==this.children.length-1&&(this.children.splice(e,1),this.children.push(t))}sendToBack(t){const e=this.children.indexOf(t);if(e===-1){this.children.unshift(t),t.parent=this._owner||this;return}if(this.sortByZIndex){let i=!0;for(const s of this.children)if(s!==t&&(s.zIndex||0)<=(t.zIndex||0)){i=!1;break}i||(t.zIndex=Number.MIN_SAFE_INTEGER,this._zOrderDirty=!0,this._normalizeZIndices())}else e!==0&&(this.children.splice(e,1),this.children.unshift(t))}bringForward(t){const e=this.children.indexOf(t);if(!(e===-1||e===this.children.length-1))if(this.sortByZIndex){const i=[...this.children].sort((n,r)=>(n.zIndex||0)-(r.zIndex||0)),s=i.indexOf(t);if(s<i.length-1){const n=i[s+1],r=n.zIndex||0,o=t.zIndex||0;r-o>1?t.zIndex=o+Math.floor((r-o)/2):(t.zIndex=r,n.zIndex=o),this._zOrderDirty=!0,this._normalizeZIndices()}}else{const i=this.children[e+1];this.children[e+1]=t,this.children[e]=i}}sendBackward(t){const e=this.children.indexOf(t);if(!(e<=0))if(this.sortByZIndex){const i=[...this.children].sort((n,r)=>(n.zIndex||0)-(r.zIndex||0)),s=i.indexOf(t);if(s>0){const n=i[s-1],r=n.zIndex||0,o=t.zIndex||0;o-r>1?t.zIndex=r+Math.floor((o-r)/2):(t.zIndex=r,n.zIndex=o),this._zOrderDirty=!0,this._normalizeZIndices()}}else{const i=this.children[e-1];this.children[e-1]=t,this.children[e]=i}}_normalizeZIndices(){if(this.children.length<=1)return;this.children.some(e=>(e.zIndex||0)>1e3||(e.zIndex||0)<-1e3)&&([...this.children].sort((i,s)=>(i.zIndex||0)-(s.zIndex||0)).forEach((i,s)=>{i.zIndex=s*10}),this._zOrderDirty=!0)}getSortedChildren(){return this.sortByZIndex&&this._zOrderDirty&&(this.children.sort((t,e)=>(t.zIndex||0)-(e.zIndex||0)),this._zOrderDirty=!1),this.children}}const It=class xt{static calculate(t,e,i,s=10,n=0,r=0){const o=e.width||0,a=e.height||0,l=i.width||0,c=i.height||0,u=i.x||0,h=i.y||0;let d,m,g,p;switch(t){case xt.TOP_LEFT:d=u-l/2+s+o/2,m=h-c/2+s+a/2,g="left",p="top";break;case xt.TOP_CENTER:d=u,m=h-c/2+s+a/2,g="center",p="top";break;case xt.TOP_RIGHT:d=u+l/2-s-o/2,m=h-c/2+s+a/2,g="right",p="top";break;case xt.CENTER_LEFT:d=u-l/2+s+o/2,m=h,g="left",p="middle";break;case xt.CENTER:d=u,m=h,g="center",p="middle";break;case xt.CENTER_RIGHT:d=u+l/2-s-o/2,m=h,g="right",p="middle";break;case xt.BOTTOM_LEFT:d=u-l/2+s+o/2,m=h+c/2-s-a/2,g="left",p="bottom";break;case xt.BOTTOM_CENTER:d=u,m=h+c/2-s-a/2,g="center",p="bottom";break;case xt.BOTTOM_RIGHT:d=u+l/2-s-o/2,m=h+c/2-s-a/2,g="right",p="bottom";break;default:d=u-l/2+s+o/2,m=h-c/2+s+a/2,g="left",p="top"}return d+=n,m+=r,{x:d,y:m,align:g,baseline:p}}static calculateAbsolute(t,e,i,s=10,n=0,r=0){const o={width:i.width,height:i.height,x:i.width/2,y:i.height/2};return xt.calculate(t,e,o,s,n,r)}};E(It,"TOP_LEFT","top-left");E(It,"TOP_CENTER","top-center");E(It,"TOP_RIGHT","top-right");E(It,"CENTER_LEFT","center-left");E(It,"CENTER","center");E(It,"CENTER_RIGHT","center-right");E(It,"BOTTOM_LEFT","bottom-left");E(It,"BOTTOM_CENTER","bottom-center");E(It,"BOTTOM_RIGHT","bottom-right");let De=It;class Ki{constructor(t={}){this.rotationX=t.rotationX??0,this.rotationY=t.rotationY??0,this.rotationZ=t.rotationZ??0,this.x=t.x??0,this.y=t.y??0,this.z=t.z??0,this._initialRotationX=this.rotationX,this._initialRotationY=this.rotationY,this._initialRotationZ=this.rotationZ,this._initialX=this.x,this._initialY=this.y,this._initialZ=this.z,this.perspective=t.perspective??800,this.sensitivity=t.sensitivity??.005,this.minRotationX=t.minRotationX??-1.5,this.maxRotationX=t.maxRotationX??1.5,this.clampX=t.clampX??!0,this.autoRotate=t.autoRotate??!1,this.autoRotateSpeed=t.autoRotateSpeed??.5,this.autoRotateAxis=t.autoRotateAxis??"y",this.inertia=t.inertia??!1,this.friction=t.friction??.92,this.velocityScale=t.velocityScale??1,this._velocityX=0,this._velocityY=0,this._lastDeltaX=0,this._lastDeltaY=0,this._lastMoveTime=0,this._isDragging=!1,this._lastMouseX=0,this._lastMouseY=0,this._canvas=null,this._boundHandlers=null,this._followTarget=null,this._followOffset={x:0,y:0,z:0},this._followLookAt=!0,this._followLerp=.1,this._targetX=null,this._targetY=null,this._targetZ=null,this._targetRotationX=null,this._targetRotationY=null,this._positionLerp=.05}project(t,e,i){if(t-=this.x,e-=this.y,i-=this.z,this.rotationZ!==0){const g=Math.cos(this.rotationZ),p=Math.sin(this.rotationZ),b=t,y=e;t=b*g-y*p,e=b*p+y*g}const s=Math.cos(this.rotationY),n=Math.sin(this.rotationY),r=t*s-i*n,o=t*n+i*s,a=Math.cos(this.rotationX),l=Math.sin(this.rotationX),c=e*a-o*l,u=e*l+o*a,h=this.perspective/(this.perspective+u),d=r*h,m=c*h;return{x:d,y:m,z:u,scale:h}}projectAll(t){return t.map(e=>this.project(e.x,e.y,e.z))}update(t){var e,i,s;if(this._followTarget){const n=this._followTarget,r=(n.x??0)+this._followOffset.x,o=(n.y??0)+this._followOffset.y,a=(n.z??0)+this._followOffset.z;if(this.x+=(r-this.x)*this._followLerp,this.y+=(o-this.y)*this._followLerp,this.z+=(a-this.z)*this._followLerp,this._followLookAt){const l=((e=this._followLookAtTarget)==null?void 0:e.x)??0,c=((i=this._followLookAtTarget)==null?void 0:i.y)??0,u=((s=this._followLookAtTarget)==null?void 0:s.z)??0,h=l-this.x,d=c-this.y,m=u-this.z,g=Math.sqrt(h*h+m*m),p=Math.atan2(h,m),b=Math.atan2(-d,g);this.rotationY+=this._angleDiff(this.rotationY,p)*this._followLerp,this.rotationX+=(b-this.rotationX)*this._followLerp}}else if(this._targetX!==null){const n=this._positionLerp;this.x+=(this._targetX-this.x)*n,this.y+=(this._targetY-this.y)*n,this.z+=(this._targetZ-this.z)*n,this._targetRotationX!==null&&(this.rotationX+=(this._targetRotationX-this.rotationX)*n),this._targetRotationY!==null&&(this.rotationY+=this._angleDiff(this.rotationY,this._targetRotationY)*n),Math.abs(this._targetX-this.x)+Math.abs(this._targetY-this.y)+Math.abs(this._targetZ-this.z)<.1&&(this.x=this._targetX,this.y=this._targetY,this.z=this._targetZ,this._targetX=null,this._targetY=null,this._targetZ=null,this._targetRotationX=null,this._targetRotationY=null)}if(this.inertia&&!this._isDragging&&!this._followTarget&&(Math.abs(this._velocityX)>1e-4||Math.abs(this._velocityY)>1e-4)&&(this.rotationY+=this._velocityY,this.rotationX+=this._velocityX,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this._velocityX*=this.friction,this._velocityY*=this.friction,Math.abs(this._velocityX)<1e-4&&(this._velocityX=0),Math.abs(this._velocityY)<1e-4&&(this._velocityY=0)),this.autoRotate&&!this._isDragging&&!this._followTarget&&!(Math.abs(this._velocityX)>.001||Math.abs(this._velocityY)>.001)){const r=this.autoRotateSpeed*t;switch(this.autoRotateAxis){case"x":this.rotationX+=r;break;case"y":this.rotationY+=r;break;case"z":this.rotationZ+=r;break}}}_angleDiff(t,e){let i=e-t;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;return i}enableMouseControl(t,e={}){this._canvas&&this.disableMouseControl(),this._canvas=t;const i=e.invertX?-1:1,s=e.invertY?-1:1;return this._boundHandlers={mousedown:n=>{this._isDragging=!0,this._lastMouseX=n.clientX,this._lastMouseY=n.clientY,this._lastMoveTime=performance.now(),this._velocityX=0,this._velocityY=0},mousemove:n=>{if(!this._isDragging)return;const r=n.clientX-this._lastMouseX,o=n.clientY-this._lastMouseY,a=r*this.sensitivity*i,l=o*this.sensitivity*s;this.rotationY+=a,this.rotationX+=l,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this.inertia&&(this._lastDeltaX=l,this._lastDeltaY=a,this._lastMoveTime=performance.now()),this._lastMouseX=n.clientX,this._lastMouseY=n.clientY},mouseup:()=>{this.inertia&&this._isDragging&&performance.now()-this._lastMoveTime<50&&(this._velocityX=this._lastDeltaX*this.velocityScale,this._velocityY=this._lastDeltaY*this.velocityScale),this._isDragging=!1},mouseleave:()=>{this.inertia&&this._isDragging&&performance.now()-this._lastMoveTime<50&&(this._velocityX=this._lastDeltaX*this.velocityScale,this._velocityY=this._lastDeltaY*this.velocityScale),this._isDragging=!1},touchstart:n=>{n.touches.length===1&&(this._isDragging=!0,this._lastMouseX=n.touches[0].clientX,this._lastMouseY=n.touches[0].clientY,this._lastMoveTime=performance.now(),this._velocityX=0,this._velocityY=0)},touchmove:n=>{if(!this._isDragging||n.touches.length!==1)return;n.preventDefault();const r=n.touches[0].clientX-this._lastMouseX,o=n.touches[0].clientY-this._lastMouseY,a=r*this.sensitivity*i,l=o*this.sensitivity*s;this.rotationY+=a,this.rotationX+=l,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this.inertia&&(this._lastDeltaX=l,this._lastDeltaY=a,this._lastMoveTime=performance.now()),this._lastMouseX=n.touches[0].clientX,this._lastMouseY=n.touches[0].clientY},touchend:()=>{this.inertia&&this._isDragging&&performance.now()-this._lastMoveTime<50&&(this._velocityX=this._lastDeltaX*this.velocityScale,this._velocityY=this._lastDeltaY*this.velocityScale),this._isDragging=!1},dblclick:()=>{this.reset()}},t.addEventListener("mousedown",this._boundHandlers.mousedown),t.addEventListener("mousemove",this._boundHandlers.mousemove),t.addEventListener("mouseup",this._boundHandlers.mouseup),t.addEventListener("mouseleave",this._boundHandlers.mouseleave),t.addEventListener("touchstart",this._boundHandlers.touchstart),t.addEventListener("touchmove",this._boundHandlers.touchmove,{passive:!1}),t.addEventListener("touchend",this._boundHandlers.touchend),t.addEventListener("dblclick",this._boundHandlers.dblclick),this}disableMouseControl(){return this._canvas&&this._boundHandlers&&(this._canvas.removeEventListener("mousedown",this._boundHandlers.mousedown),this._canvas.removeEventListener("mousemove",this._boundHandlers.mousemove),this._canvas.removeEventListener("mouseup",this._boundHandlers.mouseup),this._canvas.removeEventListener("mouseleave",this._boundHandlers.mouseleave),this._canvas.removeEventListener("touchstart",this._boundHandlers.touchstart),this._canvas.removeEventListener("touchmove",this._boundHandlers.touchmove),this._canvas.removeEventListener("touchend",this._boundHandlers.touchend),this._canvas.removeEventListener("dblclick",this._boundHandlers.dblclick)),this._canvas=null,this._boundHandlers=null,this}reset(){return this.rotationX=this._initialRotationX,this.rotationY=this._initialRotationY,this.rotationZ=this._initialRotationZ,this.x=this._initialX,this.y=this._initialY,this.z=this._initialZ,this._velocityX=0,this._velocityY=0,this._followTarget=null,this._targetX=null,this._targetY=null,this._targetZ=null,this}stopInertia(){return this._velocityX=0,this._velocityY=0,this}setPosition(t,e,i){return this.x=t,this.y=e,this.z=i,this}moveTo(t,e,i,s={}){return this._targetX=t,this._targetY=e,this._targetZ=i,this._targetRotationX=s.rotationX??null,this._targetRotationY=s.rotationY??null,this._positionLerp=s.lerp??.05,this}follow(t,e={}){return this._followTarget=t,this._followOffset={x:e.offsetX??0,y:e.offsetY??0,z:e.offsetZ??0},this._followLookAt=e.lookAt??!0,this._followLookAtTarget=e.lookAtTarget??null,this._followLerp=e.lerp??.1,this}unfollow(t=!1){return this._followTarget=null,t&&this.moveTo(this._initialX,this._initialY,this._initialZ,{rotationX:this._initialRotationX,rotationY:this._initialRotationY,lerp:.05}),this}isFollowing(){return this._followTarget!==null}setRotation(t,e,i=0){return this.rotationX=t,this.rotationY=e,this.rotationZ=i,this}rotate(t,e,i=0){return this.rotationX+=t,this.rotationY+=e,this.rotationZ+=i,this.clampX&&(this.rotationX=Math.max(this.minRotationX,Math.min(this.maxRotationX,this.rotationX))),this}isDragging(){return this._isDragging}lookAt(t,e,i){const s=t-this.x,n=e-this.y,r=i-this.z,o=Math.sqrt(s*s+r*r);return this.rotationY=Math.atan2(s,r),this.rotationX=Math.atan2(-n,o),this}}class Tt{constructor(t,e=0){this.real=t,this.imag=e}static fromPolar(t,e){return new Tt(t*Math.cos(e),t*Math.sin(e))}add(t){return new Tt(this.real+t.real,this.imag+t.imag)}subtract(t){return new Tt(this.real-t.real,this.imag-t.imag)}multiply(t){return new Tt(this.real*t.real-this.imag*t.imag,this.real*t.imag+this.imag*t.real)}divide(t){return new Tt(this.real/t,this.imag/t)}scale(t){return new Tt(this.real*t,this.imag*t)}abs(){return Math.sqrt(this.real*this.real+this.imag*this.imag)}}class Oe{static applyColorScheme(t,e,i,s,n,r){const o=(e==null?void 0:e.data)||[];for(let a=0;a<t.length;a++){const l=t[a],c=a*4;switch(i){case"futuristic":{const u=t[a]/10,h={r:0,g:5,b:10},d={r:0,g:30,b:20};if(u>.7){const m=(u-.7)*3.33;o[c]=Math.floor(h.r*(1-m)+d.r*m),o[c+1]=Math.floor(h.g*(1-m)+d.g*m),o[c+2]=Math.floor(h.b*(1-m)+d.b*m)}else{const m=u*1.43;o[c]=Math.floor(h.r*m),o[c+1]=Math.floor(h.g*m),o[c+2]=Math.floor(h.b*m)}o[c+3]=255}break;case"rainbow":if(l===0)o[c]=0,o[c+1]=0,o[c+2]=0,o[c+3]=255;else{const u=(l*10+n)%360,[h,d,m]=r(u,.8,.5);o[c]=h,o[c+1]=d,o[c+2]=m,o[c+3]=255}break;case"grayscale":{const u=l===0?0:255-l*255/s;o[c]=u,o[c+1]=u,o[c+2]=u,o[c+3]=255}break;case"binary":l!==0?(o[c]=0,o[c+1]=0,o[c+2]=0):(o[c]=255,o[c+1]=255,o[c+2]=255),o[c+3]=255;break;case"fire":{if(l==0)o[c]=0,o[c+1]=0,o[c+2]=0;else{const u=l/s;if(u<.3){const h=u/.3;o[c]=Math.floor(255*h),o[c+1]=0,o[c+2]=0}else if(u<.6){const h=(u-.3)/.3;o[c]=255,o[c+1]=Math.floor(165*h),o[c+2]=0}else if(u<.9){const h=(u-.6)/.3;o[c]=255,o[c+1]=165+Math.floor(90*h),o[c+2]=Math.floor(255*h)}else o[c]=255,o[c+1]=255,o[c+2]=255}o[c+3]=255}break;case"ocean":{if(l===0)o[c]=0,o[c+1]=20,o[c+2]=50;else{const u=l/s;o[c]=Math.floor(10+50*u),o[c+1]=Math.floor(50+150*u),o[c+2]=Math.floor(100+155*u)}o[c+3]=255}break;case"electric":{if(l===0)o[c]=0,o[c+1]=0,o[c+2]=0;else{const u=(l+n)%3,h=l%20/20;u===0?(o[c]=Math.floor(255*(.5+.5*Math.sin(h*Math.PI*2))),o[c+1]=Math.floor(128*h),o[c+2]=Math.floor(255*h)):u===1?(o[c]=Math.floor(255*h),o[c+1]=Math.floor(255*(.5+.5*Math.sin(h*Math.PI*2))),o[c+2]=Math.floor(128*h)):(o[c]=Math.floor(128*h),o[c+1]=Math.floor(255*h),o[c+2]=Math.floor(255*(.5+.5*Math.sin(h*Math.PI*2))))}o[c+3]=255}break;case"topographic":{if(l===0)o[c]=5,o[c+1]=15,o[c+2]=30;else{const u=l/s;if(u<.1){const h=u/.1;o[c]=Math.floor(5+20*h),o[c+1]=Math.floor(15+40*h),o[c+2]=Math.floor(30+50*h)}else if(u<.3){const h=(u-.1)/.2;o[c]=Math.floor(210+45*h),o[c+1]=Math.floor(180+40*h),o[c+2]=Math.floor(140+30*h)}else if(u<.7){const h=(u-.3)/.4;o[c]=Math.floor(50*(1-h)),o[c+1]=Math.floor(100+80*h),o[c+2]=Math.floor(50*(1-h))}else{const h=(u-.7)/.3;o[c]=Math.floor(150+105*h),o[c+1]=Math.floor(150+105*h),o[c+2]=Math.floor(150+105*h)}}o[c+3]=255}break;case"historic":default:{if(l===0)o[c]=0,o[c+1]=0,o[c+2]=0;else{const h=(l+n)%64;h<16?(o[c]=h*16,o[c+1]=0,o[c+2]=0):h<32?(o[c]=255,o[c+1]=(h-16)*16,o[c+2]=0):h<48?(o[c]=255-(h-32)*16,o[c+1]=255,o[c+2]=0):(o[c]=0,o[c+1]=255-(h-48)*16,o[c+2]=(h-48)*16)}o[c+3]=255}}}return e??o}static pythagorasTree(t,e,i=10,s=-2,n=2,r=-.5,o=3.5){const a=new Uint8Array(t*e),l=x=>Math.floor((x-s)*t/(n-s)),c=x=>Math.floor((x-r)*e/(o-r)),u=(x,S,C,R)=>{const M=l(x),T=c(S),A=l(C),k=c(R);let P=M,D=T;const I=Math.abs(A-M),X=Math.abs(k-T),Z=M<A?1:-1,Q=T<k?1:-1;let H=I-X;for(;P>=0&&P<t&&D>=0&&D<e&&(a[D*t+P]=255),!(P===A&&D===k);){const ut=2*H;ut>-X&&(H-=X,P+=Z),ut<I&&(H+=I,D+=Q)}},h=(x,S,C,R,M,T,A,k)=>{u(x,S,C,R),u(C,R,M,T),u(M,T,A,k),u(A,k,x,S)},d=(x,S,C,R,M)=>{if(M<=0)return;const T=C-x,A=R-S,k=C+A,P=R-T,D=x+A,I=S-T;h(x,S,C,R,k,P,D,I);const X=Math.PI/4,Z=Math.sqrt(T*T+A*A)*.7,Q=Z*Math.cos(Math.atan2(A,T)-X),H=Z*Math.sin(Math.atan2(A,T)-X),ut=Math.sqrt(T*T+A*A)*.7,Bt=ut*Math.cos(Math.atan2(A,T)+X),Dt=ut*Math.sin(Math.atan2(A,T)+X),ft=k,tt=P,J=D,ot=I,Ht=ft+Q,Yt=tt+H,$t=J+Bt,yt=ot+Dt;d(ft,tt,Ht,Yt,M-1),d(J,ot,$t,yt,M-1)},m=Math.min(i,12),g=1,p=-1/2,b=0,y=g/2;return d(p,b,y,0,m),a}static mandelbrot(t,e,i=100,s=-2.5,n=1,r=-1.5,o=1.5){const a=new Uint8Array(t*e),l=(n-s)/t,c=(o-r)/e;for(let u=0;u<e;u++){const h=u*t,d=r+u*c;for(let m=0;m<t;m++){const g=s+m*l;let p=0,b=0,y=0,w=0,x=0;do{const S=y-w+g;b=2*p*b+d,p=S,y=p*p,w=b*b,x++}while(y+w<4&&x<i);a[h+m]=x<i?x%256:0}}return a}static julia(t,e,i=100,s=-.7,n=.27,r=1,o=0,a=0){const l=new Uint8Array(t*e),c=2/r,u=-c+o,h=c+o,d=-c+a,m=c+a,g=(h-u)/t,p=(m-d)/e;for(let b=0;b<e;b++){const y=b*t,w=d+b*p;for(let x=0;x<t;x++){let C=u+x*g,R=w,M=0,T=0,A=0;do{M=C*C,T=R*R;const k=M-T+s;R=2*C*R+n,C=k,A++}while(M+T<4&&A<i);l[y+x]=A<i?A%256:0}}return l}static tricorn(t,e,i=100,s=-2.5,n=1.5,r=-1.5,o=1.5){const a=new Uint8Array(t*e),l=(n-s)/t,c=(o-r)/e;for(let u=0;u<e;u++){const h=u*t,d=r+u*c;for(let m=0;m<t;m++){const g=s+m*l;let p=0,b=0,y=0,w=0,x=0;do{const S=y-w+g;b=-2*p*b+d,p=S,y=p*p,w=b*b,x++}while(y+w<4&&x<i);a[h+m]=x<i?x%256:0}}return a}static phoenix(t,e,i=100,s=.5,n=.5,r=-2,o=2,a=-2,l=2){const c=new Uint8Array(t*e),u=(o-r)/t,h=(l-a)/e;for(let d=0;d<e;d++){const m=d*t,g=a+d*h;for(let p=0;p<t;p++){const b=r+p*u;let y=0,w=0,x=0,S=0,C=0,R=0,M=0;do{const T=C-R+b+s*x+n,A=2*y*w+g+s*S;x=y,S=w,y=T,w=A,C=y*y,R=w*w,M++}while(C+R<4&&M<i);c[m+p]=M<i?M%256:0}}return c}static newton(t,e,i=100,s=1e-6,n=-2,r=2,o=-2,a=2){const l=new Uint8Array(t*e),c=s*s,u=r-n,h=a-o,d=3,m=new Float64Array(d),g=new Float64Array(d);for(let y=0;y<d;y++){const w=2*Math.PI*y/d;m[y]=Math.cos(w),g[y]=Math.sin(w)}const p=u/t,b=h/e;for(let y=0;y<e;y++){const w=y*t,x=o+y*b;for(let S=0;S<t;S++){let R=n+S*p,M=x,T=0,A=-1;for(;T<i&&A<0;){const k=R*R-M*M,P=2*R*M,D=k*R-P*M-1,I=k*M+P*R,X=3*k,Z=3*P,Q=X*X+Z*Z;if(Q<c)break;const H=1/Q,ut=(D*X+I*Z)*H,Bt=(I*X-D*Z)*H,Dt=R-ut,ft=M-Bt;for(let tt=0;tt<d;tt++){const J=Dt-m[tt],ot=ft-g[tt];if(J*J+ot*ot<c){A=tt;break}}R=Dt,M=ft,T++}if(A>=0){const k=1-Math.min(T/i,1),P=A*(255/d);l[w+S]=Math.floor(P+k*(255/d))}else l[w+S]=0}}return l}static sierpinski(t,e,i=6,s=0,n=1,r=0,o=1){const a=new Uint8Array(t*e).fill(1),l=Math.sqrt(3)/2,c=n-s,h=(o-r)/c;if(Math.abs(h-l)>1e-9){const y=(r+o)/2,w=c*l;r=y-w/2,o=y+w/2}const m=(1<<Math.min(i,32))-1,g=(n-s)/t,p=(o-r)/e,b=2/Math.sqrt(3);for(let y=0;y<e;++y){const w=r+y*p,x=Math.floor(w*b),S=x*.5;for(let C=0;C<t;++C){const R=s+C*g;Math.floor(R-S)&x&m&&(a[y*t+C]=0)}}return a}static sierpinskiCarpet(t,e,i=5,s=0,n=1,r=0,o=1){const a=new Uint8Array(t*e).fill(1),l=n-s,c=o-r,u=Math.max(l,c),h=(s+n)/2,d=(r+o)/2;s=h-u/2,n=h+u/2,r=d-u/2,o=d+u/2;const m=Math.pow(3,i),g=(p,b)=>{let y=p,w=b;for(;y>0||w>0;){if(y%3===1&&w%3===1)return!0;y=Math.floor(y/3),w=Math.floor(w/3)}return!1};for(let p=0;p<e;++p){const y=(r+p/e*(o-r))*m,w=(Math.floor(y)%m+m)%m;for(let x=0;x<t;++x){const C=(s+x/t*(n-s))*m,R=(Math.floor(C)%m+m)%m;g(R,w)&&(a[p*t+x]=0)}}return a}static barnsleyFern(t,e,i=1e5){const s=new Uint8Array(t*e).fill(0);let n=0,r=0;const o=Math.min(t,e)/10,a=t/2;for(let l=0;l<i;l++){const c=Math.random();let u,h;c<.01?(u=0,h=.16*r):c<.86?(u=.85*n+.04*r,h=-.04*n+.85*r+1.6):c<.93?(u=.2*n-.26*r,h=.23*n+.22*r+1.6):(u=-.15*n+.28*r,h=.26*n+.24*r+.44),n=u,r=h;const d=Math.floor(n*o+a),m=Math.floor(e-r*o);if(d>=0&&d<t&&m>=0&&m<e){const g=m*t+d;s[g]<255&&s[g]++}}return s}static lyapunov(t,e,i=1e3,s="AB",n=3.4,r=4,o=3.4,a=4){console.time("lyapunov"),s=s.toUpperCase().replace(/[^AB]/g,"")||"AB";const l=s.length,c=new Float32Array(t*e);let u=1/0,h=-1/0;for(let g=0;g<e;g++){const p=o+(a-o)*g/e;for(let b=0;b<t;b++){const y=n+(r-n)*b/t;let w=.5;for(let R=0;R<100;R++)w=(s[R%l]==="A"?y:p)*w*(1-w);let x=0,S=0;for(;S<i;){const R=s[S%l]==="A"?y:p;w=R*w*(1-w);const M=Math.abs(R*(1-2*w));if(x+=Math.log(Math.max(M,1e-10)),S++,Math.abs(x/S)>10)break}const C=x/S;c[g*t+b]=C,C>-10&&C<10&&(C<u&&(u=C),C>h&&(h=C))}}u===h&&(u-=1,h+=1);const d=h-u,m=new Uint8Array(t*e);for(let g=0;g<c.length;g++){let p=c[g];p=Math.max(-10,Math.min(10,p));let b=(p-u)/d;m[g]=Math.floor(b*255)}return console.timeEnd("lyapunov"),m}static koch(t,e,i=4,s=-2,n=2,r=-2,o=2){const a=new Uint8Array(t*e),l=w=>Math.floor((w-s)*t/(n-s)),c=w=>Math.floor((w-r)*e/(o-r)),u=(w,x,S,C)=>{const R=l(w),M=c(x),T=l(S),A=c(C);let k=R,P=M;const D=Math.abs(T-R),I=Math.abs(A-M),X=R<T?1:-1,Z=M<A?1:-1;let Q=D-I;for(;k>=0&&k<t&&P>=0&&P<e&&(a[P*t+k]=255),!(k===T&&P===A);){const H=2*Q;H>-I&&(Q-=I,k+=X),H<D&&(Q+=D,P+=Z)}},h=(w,x,S,C,R)=>{if(R<=0){u(w,x,S,C);return}const M=(S-w)/3,T=(C-x)/3,A=w+M,k=x+T,P=w+2*M,D=x+2*T,I=Math.PI/3,X=A+M*Math.cos(I)-T*Math.sin(I),Z=k+M*Math.sin(I)+T*Math.cos(I);h(w,x,A,k,R-1),h(A,k,X,Z,R-1),h(X,Z,P,D,R-1),h(P,D,S,C,R-1)},d=Math.min(i,10),m=3,g=m*Math.sqrt(3)/2,p=[0,-g/2+.5],b=[-3/2,g/2+.5],y=[m/2,g/2+.5];return h(p[0],p[1],b[0],b[1],d),h(b[0],b[1],y[0],y[1],d),h(y[0],y[1],p[0],p[1],d),a}}E(Oe,"types",{MANDELBROT:"mandelbrot",TRICORN:"tricorn",PHOENIX:"phoenix",JULIA:"julia",SIERPINSKI:"sierpinski",SCARPET:"sierpinskiCarpet",BARNSEY_FERN:"barnsleyFern",KOCH:"koch",PYTHAGORAS_TREE:"pythagorasTree",NEWTON:"newton",LYAPUNOV:"lyapunov"});E(Oe,"colors",{FUTURISTIC:"futuristic",RAINBOW:"rainbow",GRAYSCALE:"grayscale",TOPOGRAPHIC:"topographic",FIRE:"fire",OCEAN:"ocean",ELECTRIC:"electric",BINARY:"binary",HISTORIC:"historic"});const q=class{static seed(t){t>0&&t<1&&(t*=65536),t=Math.floor(t),t<256&&(t|=t<<8);for(let e=0;e<256;e++){let i;e&1?i=_(this,he)[e]^t&255:i=_(this,he)[e]^t>>8&255,_(this,z)[e]=_(this,z)[e+256]=i,_(this,V)[e]=_(this,V)[e+256]=_(this,we)[i%12]}}static simplex2(t,e){let i,s,n;const r=(t+e)*_(this,Me),o=Math.floor(t+r),a=Math.floor(e+r),l=(o+a)*_(this,Nt),c=t-o+l,u=e-a+l;let h,d;c>u?(h=1,d=0):(h=0,d=1);const m=c-h+_(this,Nt),g=u-d+_(this,Nt),p=c-1+2*_(this,Nt),b=u-1+2*_(this,Nt),y=o&255,w=a&255,x=_(this,V)[y+_(this,z)[w]],S=_(this,V)[y+h+_(this,z)[w+d]],C=_(this,V)[y+1+_(this,z)[w+1]];let R=.5-c*c-u*u;R<0?i=0:(R*=R,i=R*R*x.dot2(c,u));let M=.5-m*m-g*g;M<0?s=0:(M*=M,s=M*M*S.dot2(m,g));let T=.5-p*p-b*b;return T<0?n=0:(T*=T,n=T*T*C.dot2(p,b)),70*(i+s+n)}static simplex3(t,e,i){let s,n,r,o;const a=(t+e+i)*_(this,Se),l=Math.floor(t+a),c=Math.floor(e+a),u=Math.floor(i+a),h=(l+c+u)*_(this,gt),d=t-l+h,m=e-c+h,g=i-u+h;let p,b,y,w,x,S;d>=m?m>=g?(p=1,b=0,y=0,w=1,x=1,S=0):d>=g?(p=1,b=0,y=0,w=1,x=0,S=1):(p=0,b=0,y=1,w=1,x=0,S=1):m<g?(p=0,b=0,y=1,w=0,x=1,S=1):d<g?(p=0,b=1,y=0,w=0,x=1,S=1):(p=0,b=1,y=0,w=1,x=1,S=0);const C=d-p+_(this,gt),R=m-b+_(this,gt),M=g-y+_(this,gt),T=d-w+2*_(this,gt),A=m-x+2*_(this,gt),k=g-S+2*_(this,gt),P=d-1+3*_(this,gt),D=m-1+3*_(this,gt),I=g-1+3*_(this,gt),X=l&255,Z=c&255,Q=u&255,H=_(this,V)[X+_(this,z)[Z+_(this,z)[Q]]],ut=_(this,V)[X+p+_(this,z)[Z+b+_(this,z)[Q+y]]],Bt=_(this,V)[X+w+_(this,z)[Z+x+_(this,z)[Q+S]]],Dt=_(this,V)[X+1+_(this,z)[Z+1+_(this,z)[Q+1]]];let ft=.6-d*d-m*m-g*g;ft<0?s=0:(ft*=ft,s=ft*ft*H.dot3(d,m,g));let tt=.6-C*C-R*R-M*M;tt<0?n=0:(tt*=tt,n=tt*tt*ut.dot3(C,R,M));let J=.6-T*T-A*A-k*k;J<0?r=0:(J*=J,r=J*J*Bt.dot3(T,A,k));let ot=.6-P*P-D*D-I*I;return ot<0?o=0:(ot*=ot,o=ot*ot*Dt.dot3(P,D,I)),32*(s+n+r+o)}static perlin2(t,e){const i=Math.floor(t),s=Math.floor(e);t=t-i,e=e-s;const n=i&255,r=s&255,o=_(this,V)[n+_(this,z)[r]].dot2(t,e),a=_(this,V)[n+_(this,z)[r+1]].dot2(t,e-1),l=_(this,V)[n+1+_(this,z)[r]].dot2(t-1,e),c=_(this,V)[n+1+_(this,z)[r+1]].dot2(t-1,e-1),u=K(this,st,qt).call(this,t);return K(this,st,bt).call(this,K(this,st,bt).call(this,o,l,u),K(this,st,bt).call(this,a,c,u),K(this,st,qt).call(this,e))}static perlin3(t,e,i){const s=Math.floor(t),n=Math.floor(e),r=Math.floor(i);t=t-s,e=e-n,i=i-r;const o=s&255,a=n&255,l=r&255,c=_(this,V)[o+_(this,z)[a+_(this,z)[l]]].dot3(t,e,i),u=_(this,V)[o+_(this,z)[a+_(this,z)[l+1]]].dot3(t,e,i-1),h=_(this,V)[o+_(this,z)[a+1+_(this,z)[l]]].dot3(t,e-1,i),d=_(this,V)[o+_(this,z)[a+1+_(this,z)[l+1]]].dot3(t,e-1,i-1),m=_(this,V)[o+1+_(this,z)[a+_(this,z)[l]]].dot3(t-1,e,i),g=_(this,V)[o+1+_(this,z)[a+_(this,z)[l+1]]].dot3(t-1,e,i-1),p=_(this,V)[o+1+_(this,z)[a+1+_(this,z)[l]]].dot3(t-1,e-1,i),b=_(this,V)[o+1+_(this,z)[a+1+_(this,z)[l+1]]].dot3(t-1,e-1,i-1),y=K(this,st,qt).call(this,t),w=K(this,st,qt).call(this,e),x=K(this,st,qt).call(this,i);return K(this,st,bt).call(this,K(this,st,bt).call(this,K(this,st,bt).call(this,c,m,y),K(this,st,bt).call(this,u,g,y),x),K(this,st,bt).call(this,K(this,st,bt).call(this,h,p,y),K(this,st,bt).call(this,d,b,y),x),w)}};ct=new WeakMap;we=new WeakMap;he=new WeakMap;z=new WeakMap;V=new WeakMap;Me=new WeakMap;Nt=new WeakMap;Se=new WeakMap;gt=new WeakMap;st=new WeakSet;qt=function(f){return f*f*f*(f*(f*6-15)+10)};bt=function(f,t,e){return(1-e)*f+e*t};Y(q,st);Y(q,ct,class{constructor(f,t,e){this.x=f,this.y=t,this.z=e}dot2(f,t){return this.x*f+this.y*t}dot3(f,t,e){return this.x*f+this.y*t+this.z*e}});Y(q,we,[new(_(q,ct))(1,1,0),new(_(q,ct))(-1,1,0),new(_(q,ct))(1,-1,0),new(_(q,ct))(-1,-1,0),new(_(q,ct))(1,0,1),new(_(q,ct))(-1,0,1),new(_(q,ct))(1,0,-1),new(_(q,ct))(-1,0,-1),new(_(q,ct))(0,1,1),new(_(q,ct))(0,-1,1),new(_(q,ct))(0,1,-1),new(_(q,ct))(0,-1,-1)]);Y(q,he,[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180]);Y(q,z,new Array(512));Y(q,V,new Array(512));Y(q,Me,.5*(Math.sqrt(3)-1));Y(q,Nt,(3-Math.sqrt(3))/6);Y(q,Se,1/3);Y(q,gt,1/6);q.seed(0);let _t=q;function $e(f=800,t=800,e){const{divisions:i=5,zoomType:s="in",color1:n=[255,0,0,255],color2:r=[0,0,255,255],color3:o=[0,0,0,255],backgroundColor:a=[255,255,255,255]}=e||{},l=new Uint8ClampedArray(f*t*4);for(let x=0;x<l.length;x+=4)l[x]=a[0],l[x+1]=a[1],l[x+2]=a[2],l[x+3]=a[3]||255;const c=s==="in"?1:2,u=Math.max(f,t),h=u/c,d=u/c,m=.5*c,g=.5*c,p=(Math.sqrt(5)+1)/2,b=5;let y=[];for(let x=0;x<b*2;x++){const S=Tt.fromPolar(1,(2*x-1)*Math.PI/(b*2)),C=Tt.fromPolar(1,(2*x+1)*Math.PI/(b*2));x%2===0?y.push(["thin",new Tt(0),C,S]):y.push(["thin",new Tt(0),S,C])}for(let x=0;x<i;x++){const S=[];for(const[C,R,M,T]of y)if(C==="thin"){const A=R.add(M.subtract(R).scale(1/p));S.push(["thin",T,A,M]),S.push(["thicc",A,T,R])}else{const A=M.add(R.subtract(M).scale(1/p)),k=M.add(T.subtract(M).scale(1/p));S.push(["thicc",k,T,R]),S.push(["thicc",A,k,M]),S.push(["thin",k,A,R])}y=S}function w(x){const S=Math.floor((x.real*h+m*h)*f/u),C=Math.floor((x.imag*d+g*d)*t/u);return{x:S,y:C}}for(const[x,S,C,R]of y){const M=w(S),T=w(C),A=w(R);je(l,M,T,A,x==="thin"?n:r,f,t)}if(o&&o[3]>0)for(const[x,S,C,R]of y){const M=w(S),T=w(C),A=w(R);ve(l,M,T,o,f,t),ve(l,T,A,o,f,t),ve(l,A,M,o,f,t)}return l}function je(f,t,e,i,s,n,r){t.y>e.y&&([t,e]=[e,t]),t.y>i.y&&([t,i]=[i,t]),e.y>i.y&&([e,i]=[i,e]);const o=s[0],a=s[1],l=s[2],c=s[3]||255;if(e.y===i.y)ke(f,t,e,i,o,a,l,c,n,r);else if(t.y===e.y)Ee(f,t,e,i,o,a,l,c,n,r);else{const u={x:Math.floor(t.x+(e.y-t.y)/(i.y-t.y)*(i.x-t.x)),y:e.y};ke(f,t,e,u,o,a,l,c,n,r),Ee(f,e,u,i,o,a,l,c,n,r)}}function ke(f,t,e,i,s,n,r,o,a,l){const c=(e.x-t.x)/(e.y-t.y||1),u=(i.x-t.x)/(i.y-t.y||1);let h=t.x,d=t.x;for(let m=t.y;m<=e.y;m++){if(m>=0&&m<l){const g=Math.max(0,Math.min(Math.floor(h),a-1)),p=Math.max(0,Math.min(Math.floor(d),a-1));for(let b=Math.min(g,p);b<=Math.max(g,p);b++){const y=(m*a+b)*4;y>=0&&y<f.length-3&&(f[y]=s,f[y+1]=n,f[y+2]=r,f[y+3]=o)}}h+=c,d+=u}}function Ee(f,t,e,i,s,n,r,o,a,l){const c=(i.x-t.x)/(i.y-t.y||1),u=(i.x-e.x)/(i.y-e.y||1);let h=i.x,d=i.x;for(let m=i.y;m>t.y;m--)if(m>=0&&m<l){h-=c,d-=u;const g=Math.max(0,Math.min(Math.floor(h),a-1)),p=Math.max(0,Math.min(Math.floor(d),a-1));for(let b=Math.min(g,p);b<=Math.max(g,p);b++){const y=(m*a+b)*4;y>=0&&y<f.length-3&&(f[y]=s,f[y+1]=n,f[y+2]=r,f[y+3]=o)}}}function ve(f,t,e,i,s,n){const r=i[0],o=i[1],a=i[2],l=i[3]||255;let c=t.x,u=t.y,h=e.x,d=e.y;const m=Math.abs(h-c),g=Math.abs(d-u),p=c<h?1:-1,b=u<d?1:-1;let y=m-g;for(;;){if(c>=0&&c<s&&u>=0&&u<n){const x=(u*s+c)*4;if(x>=0&&x<f.length-3){const S=l/255;f[x]=Math.round(f[x]*(1-S)+r*S),f[x+1]=Math.round(f[x+1]*(1-S)+o*S),f[x+2]=Math.round(f[x+2]*(1-S)+a*S),f[x+3]=255}}if(c===h&&u===d)break;const w=2*y;w>-g&&(y-=g,c+=p),w<m&&(y+=m,u+=b)}}class Qi{static void(t,e,i={}){const{background:s=[255,255,255,255],foreground:n=[0,0,200,255]}=i,r=new Uint8ClampedArray(t*e*4);for(let o=0;o<r.length;o+=4)r[o]=s[0],r[o+1]=s[1],r[o+2]=s[2],r[o+3]=s[3];return r}static solidGrid(t,e,i={}){const{spacing:s=8,background:n=[0,0,0,0],foreground:r=[128,128,128,255]}=i,o=new Uint8ClampedArray(t*e*4);for(let a=0;a<e;a++){const l=a%s===0;for(let c=0;c<t;c++){const h=c%s===0||l,d=(a*t+c)*4,m=h?r:n;o[d]=m[0],o[d+1]=m[1],o[d+2]=m[2],o[d+3]=m[3]}}return o}static checkerboard(t,e,i={}){const{cellSize:s=8,color1:n=[0,0,0,255],color2:r=[255,255,255,255]}=i,o=new Uint8ClampedArray(t*e*4);for(let a=0;a<e;a++){const l=Math.floor(a/s);for(let c=0;c<t;c++){const d=(Math.floor(c/s)+l)%2===0?n:r,m=(a*t+c)*4;o.set(d,m)}}return o}static stripes(t,e,i={}){const{spacing:s=4,thickness:n=1,background:r=[0,0,0,0],foreground:o=[255,255,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let l=0;l<e;l++)for(let c=0;c<t;c++){const h=(c+l)%s<n,d=(l*t+c)*4;a.set(h?o:r,d)}return a}static honeycomb(t,e,i={}){const{radius:s=10,lineWidth:n=1,foreground:r=[255,255,255,255],background:o=[0,0,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let y=0;y<a.length;y+=4)a[y]=o[0],a[y+1]=o[1],a[y+2]=o[2],a[y+3]=o[3];const l=Math.floor(t/2),c=Math.floor(e/2),u=(y,w,x,S,C)=>{const R=Math.abs(y-x),M=Math.abs(w-S),T=C*Math.sqrt(3)/2;return M>T||R>C?!1:C*T*2>=C*M*2+T*R},h=s-n,d=s*Math.sqrt(3),m=Math.max(0,Math.floor(l-s-1)),g=Math.min(t-1,Math.ceil(l+s+1)),p=Math.max(0,Math.floor(c-d/2-1)),b=Math.min(e-1,Math.ceil(c+d/2+1));for(let y=p;y<=b;y++)for(let w=m;w<=g;w++){const x=u(w,y,l,c,s),S=h>0?u(w,y,l,c,h):!1;if(x&&!S){const C=(y*t+w)*4;a[C]=r[0],a[C+1]=r[1],a[C+2]=r[2],a[C+3]=r[3]}}return a}static harlequin(t,e,i={}){const{size:s=20,spacing:n=0,background:r=[255,255,255,255],foreground:o=[0,0,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let m=0;m<a.length;m+=4)a[m]=r[0],a[m+1]=r[1],a[m+2]=r[2],a[m+3]=r[3];const l=s*2,c=s*2,u=l+n,h=c+n,d=(m,g,p,b)=>{const y=Math.abs(m-p)/(l/2),w=Math.abs(g-b)/(c/2);return y+w<=1};for(let m=-1;m<e/h+1;m++)for(let g=-1;g<t/u+1;g++){const p=g*u+u/2,b=m*h+h/2;if(!((m+g)%2===0))continue;const w=Math.max(0,Math.floor(p-l/2)),x=Math.min(t-1,Math.ceil(p+l/2)),S=Math.max(0,Math.floor(b-c/2)),C=Math.min(e-1,Math.ceil(b+c/2));for(let R=S;R<=C;R++)for(let M=w;M<=x;M++)if(d(M,R,p,b)){const T=(R*t+M)*4;a[T]=o[0],a[T+1]=o[1],a[T+2]=o[2],a[T+3]=o[3]}}return a}static circles(t,e,i={}){const{radius:s=10,lineWidth:n=2,spacing:r=5,background:o=[0,0,0,255],foreground:a=[255,255,255,255]}=i,l=new Uint8ClampedArray(t*e*4);for(let h=0;h<l.length;h+=4)l[h]=o[0],l[h+1]=o[1],l[h+2]=o[2],l[h+3]=o[3];const c=s*2+r,u=(h,d,m,g,p)=>{const b=h-m,y=d-g;return b*b+y*y<=p*p};for(let h=0;h<Math.ceil(e/c)+1;h++)for(let d=0;d<Math.ceil(t/c)+1;d++){const m=d*c+s,g=h*c+s;if(m<-s||m>t+s||g<-s||g>e+s)continue;const p=Math.max(0,Math.floor(m-s)),b=Math.min(t-1,Math.ceil(m+s)),y=Math.max(0,Math.floor(g-s)),w=Math.min(e-1,Math.ceil(g+s)),x=s-n;for(let S=y;S<=w;S++)for(let C=p;C<=b;C++){const R=u(C,S,m,g,s),M=u(C,S,m,g,x);if(R&&!M){const T=(S*t+C)*4;l[T]=a[0],l[T+1]=a[1],l[T+2]=a[2],l[T+3]=a[3]}}}return l}static diamonds(t,e,i={}){const{size:s=16,squareSize:n=6,background:r=[255,255,255,255],foreground:o=[0,0,0,255],innerColor:a=[255,255,255,255]}=i,l=new Uint8ClampedArray(t*e*4);for(let d=0;d<l.length;d+=4)l[d]=r[0],l[d+1]=r[1],l[d+2]=r[2],l[d+3]=r[3];const c=s,u=(d,m,g,p,b)=>{const y=Math.abs(d-g),w=Math.abs(m-p);return y+w<=b/2},h=(d,m,g,p,b)=>Math.abs(d-g)<=b/2&&Math.abs(m-p)<=b/2;for(let d=-1;d<e/c+1;d++)for(let m=-1;m<t/c+1;m++){const g=m*c+c/2,p=d*c+c/2;if(g<-c||g>t+c||p<-c||p>e+c)continue;const b=Math.max(0,Math.floor(g-c/2)),y=Math.min(t-1,Math.ceil(g+c/2)),w=Math.max(0,Math.floor(p-c/2)),x=Math.min(e-1,Math.ceil(p+c/2));for(let S=w;S<=x;S++)for(let C=b;C<=y;C++){const R=u(C,S,g,p,c),M=h(C,S,g,p,n);if(R){const T=(S*t+C)*4;M?(l[T]=a[0],l[T+1]=a[1],l[T+2]=a[2],l[T+3]=a[3]):(l[T]=o[0],l[T+1]=o[1],l[T+2]=o[2],l[T+3]=o[3])}}}return l}static cubes(t,e,i={}){const{size:s=10,spacing:n=2,background:r=[0,0,0,255],foreground:o=[255,100,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let c=0;c<a.length;c+=4)a[c]=r[0],a[c+1]=r[1],a[c+2]=r[2],a[c+3]=r[3];const l=s+n;for(let c=0;c<Math.ceil(e/l)+1;c++)for(let u=0;u<Math.ceil(t/l)+1;u++){const h=u*l,d=c*l;if(!(h>=t||d>=e))for(let m=d;m<Math.min(d+s,e);m++)for(let g=h;g<Math.min(h+s,t);g++){const p=(m*t+g)*4;a[p]=o[0],a[p+1]=o[1],a[p+2]=o[2],a[p+3]=o[3]}}return a}static cross(t,e,i={}){const{size:s=8,thickness:n=2,spacing:r=16,background:o=[255,255,255,255],foreground:a=[80,80,80,255]}=i,l=new Uint8ClampedArray(t*e*4);for(let c=0;c<l.length;c+=4)l[c]=o[0],l[c+1]=o[1],l[c+2]=o[2],l[c+3]=o[3];for(let c=0;c<Math.ceil(e/r)+1;c++)for(let u=0;u<Math.ceil(t/r)+1;u++){const h=u*r,d=c*r;if(h<-s||h>t+s||d<-s||d>e+s)continue;const m=h-s/2,g=h+s/2,p=d-n/2,b=d+n/2;for(let C=Math.max(0,Math.floor(p));C<Math.min(e,Math.ceil(b));C++)for(let R=Math.max(0,Math.floor(m));R<Math.min(t,Math.ceil(g));R++){const M=(C*t+R)*4;l[M]=a[0],l[M+1]=a[1],l[M+2]=a[2],l[M+3]=a[3]}const y=h-n/2,w=h+n/2,x=d-s/2,S=d+s/2;for(let C=Math.max(0,Math.floor(x));C<Math.min(e,Math.ceil(S));C++)for(let R=Math.max(0,Math.floor(y));R<Math.min(t,Math.ceil(w));R++){const M=(C*t+R)*4;l[M]=a[0],l[M+1]=a[1],l[M+2]=a[2],l[M+3]=a[3]}}return l}static mesh(t,e,i={}){const{spacing:s=20,lineWidth:n=2,background:r=[255,255,255,0],foreground:o=[0,0,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let l=0;l<a.length;l+=4)a[l]=r[0],a[l+1]=r[1],a[l+2]=r[2],a[l+3]=r[3];for(let l=0;l<e;l++)for(let c=0;c<t;c++){const u=(c+l)%s,h=u<n||u>s-n,d=(c-l+e)%s,m=d<n||d>s-n;if(h||m){const g=(l*t+c)*4;a[g]=o[0],a[g+1]=o[1],a[g+2]=o[2],a[g+3]=o[3]}}return a}static isometric(t,e,i={}){const{cellSize:s=20,lineWidth:n=1,background:r=[0,0,0,0],foreground:o=[0,255,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let u=0;u<a.length;u+=4)a[u]=r[0],a[u+1]=r[1],a[u+2]=r[2],a[u+3]=r[3];const l=s,c=s/2;for(let u=0;u<e;u++)for(let h=0;h<t;h++){const d=h%l,m=u%c,g=m-d/2,p=m+d/2-c,b=Math.abs(g)<n/2,y=Math.abs(p)<n/2;if(b||y){const w=(u*t+h)*4;a[w]=o[0],a[w+1]=o[1],a[w+2]=o[2],a[w+3]=o[3]}}return a}static weave(t,e,i={}){const{tileSize:s=40,lineWidth:n=2,background:r=[255,255,255,255],foreground:o=[0,0,0,255]}=i,a=new Uint8ClampedArray(t*e*4);for(let l=0;l<a.length;l+=4)a[l]=r[0],a[l+1]=r[1],a[l+2]=r[2],a[l+3]=r[3];for(let l=0;l<e;l++)for(let c=0;c<t;c++){const u=c%s,h=l%s,d=Math.abs((h+s/2)%s-s/2)<n/2,m=Math.abs((u+h*2+s*1.5)%s-s/2)<n/2,g=Math.abs((u-h*2+s*1.5)%s-s/2)<n/2;if(d||m||g){const b=(l*t+c)*4;a[b]=o[0],a[b+1]=o[1],a[b+2]=o[2],a[b+3]=o[3]}}return a}static perlinNoise(t,e,i={}){const{background:s=[0,0,0,0],foreground:n=[255,255,255,255],scale:r=.1,octaves:o=4,persistence:a=.5,lacunarity:l=2,seed:c=Math.random()*65536}=i,u=new Uint8ClampedArray(t*e*4);_t.seed(c);for(let h=0;h<e;h++)for(let d=0;d<t;d++){let m=1,g=1,p=0,b=0;for(let S=0;S<o;S++){const C=d*r*g,R=h*r*g,M=_t.perlin2(C,R);p+=M*m,b+=m,m*=a,g*=l}p/=b;const y=(p+1)*.5,w=[Math.floor(s[0]+y*(n[0]-s[0])),Math.floor(s[1]+y*(n[1]-s[1])),Math.floor(s[2]+y*(n[2]-s[2])),Math.floor(s[3]+y*(n[3]-s[3]))],x=(h*t+d)*4;u.set(w,x)}return u}static circularGradient(t,e,i={}){const{innerColor:s=[255,255,255,255],outerColor:n=[0,0,0,255],centerX:r=t/2,centerY:o=e/2,radius:a=Math.min(t,e)/2,fadeExponent:l=1}=i,c=new Uint8ClampedArray(t*e*4);for(let u=0;u<e;u++)for(let h=0;h<t;h++){const d=(u*t+h)*4,m=h-r,g=u-o,p=Math.sqrt(m*m+g*g);let b=Math.min(p/a,1);b=Math.pow(b,l);const y=[Math.floor(s[0]+b*(n[0]-s[0])),Math.floor(s[1]+b*(n[1]-s[1])),Math.floor(s[2]+b*(n[2]-s[2])),Math.floor(s[3]+b*(n[3]-s[3]))];c.set(y,d)}return c}static noiseDisplacement(t,e,i={}){const{gridSpacing:s=16,gridColor:n=[255,255,255,255],background:r=[0,0,0,0],displacementScale:o=8,noiseScale:a=.05,gridThickness:l=1,seed:c=Math.random()*65536}=i,u=new Uint8ClampedArray(t*e*4);_t.seed(c);for(let h=0;h<u.length;h+=4)u.set(r,h);for(let h=0;h<e;h++)for(let d=0;d<t;d++){const m=_t.perlin2(d*a,h*a),g=_t.perlin2((d+31.416)*a,(h+27.182)*a),p=d+m*o,b=h+g*o,y=p%s<l||p%s>s-l,w=b%s<l||b%s>s-l;if(y||w){const x=(h*t+d)*4;u.set(n,x)}}return u}static dotPattern(t,e,i={}){const{dotSize:s=3,spacing:n=12,dotColor:r=[0,0,0,255],background:o=[255,255,255,255],useNoise:a=!1,noiseScale:l=.1,noiseDensity:c=.4,seed:u=Math.random()*65536}=i,h=new Uint8ClampedArray(t*e*4);a&&_t.seed(u);for(let d=0;d<h.length;d+=4)h.set(o,d);if(a){for(let d=0;d<e;d++)for(let m=0;m<t;m++)if((_t.perlin2(m*l,d*l)+1)*.5>c)for(let b=-s;b<=s;b++)for(let y=-s;y<=s;y++){const w=m+y,x=d+b;if(w>=0&&w<t&&x>=0&&x<e&&y*y+b*b<=s*s){const C=(x*t+w)*4;h.set(r,C)}}}else for(let d=Math.floor(n/2);d<e;d+=n)for(let m=Math.floor(n/2);m<t;m+=n)for(let g=-s;g<=s;g++)for(let p=-s;p<=s;p++){const b=m+p,y=d+g;if(b>=0&&b<t&&y>=0&&y<e&&p*p+g*g<=s*s){const x=(y*t+b)*4;h.set(r,x)}}return h}static voronoi(t,e,i={}){const{cellCount:s=20,cellColors:n=null,edgeColor:r=[0,0,0,255],edgeThickness:o=1.5,seed:a=Math.random()*1e3,jitter:l=.5,baseColor:c=null,colorVariation:u=.3}=i,h=new Uint8ClampedArray(t*e*4);_t.seed(a);const d=[],m=[],g=()=>{let S=Math.sin(a*.167+d.length*.423)*1e4;return S-Math.floor(S)},p=Math.sqrt(s),b=t/p,y=e/p,w=S=>{if(c){const[C,R,M,T]=c,A=Math.max(C,R,M)/255,k=Math.min(C,R,M)/255,P=(A+k)/2;let D,I;if(A===k)D=I=0;else{const J=A-k;I=P>.5?J/(2-A-k):J/(A+k),A===C/255?D=(R/255-M/255)/J+(R/255<M/255?6:0):A===R/255?D=(M/255-C/255)/J+2:D=(C/255-R/255)/J+4,D/=6}const X=_t.perlin2(S*.15,0)*u*.3,Z=_t.perlin2(0,S*.15)*u,Q=_t.perlin2(S*.15,S*.15)*u*.5;D=(D+X)%1,I=Math.min(1,Math.max(0,I*(1+Z)));const H=Math.min(.9,Math.max(.1,P*(1+Q)));let ut,Bt,Dt;if(I===0)ut=Bt=Dt=H;else{const J=(Yt,$t,yt)=>(yt<0&&(yt+=1),yt>1&&(yt-=1),yt<.16666666666666666?Yt+($t-Yt)*6*yt:yt<.5?$t:yt<.6666666666666666?Yt+($t-Yt)*(.6666666666666666-yt)*6:Yt),ot=H<.5?H*(1+I):H+I-H*I,Ht=2*H-ot;ut=J(Ht,ot,D+1/3),Bt=J(Ht,ot,D),Dt=J(Ht,ot,D-1/3)}const ft=.05,tt=()=>(g()*2-1)*ft;return[Math.min(255,Math.max(0,Math.floor(ut*255*(1+tt())))),Math.min(255,Math.max(0,Math.floor(Bt*255*(1+tt())))),Math.min(255,Math.max(0,Math.floor(Dt*255*(1+tt())))),T]}else{const C=S*.618033988749895%1;let R,M,T;const A=C*6,k=Math.floor(A),P=A-k,D=.5,I=.5*(1-P),X=.5*(1-(1-P));switch(k%6){case 0:R=.5,M=X,T=D;break;case 1:R=I,M=.5,T=D;break;case 2:R=D,M=.5,T=X;break;case 3:R=D,M=I,T=.5;break;case 4:R=X,M=D,T=.5;break;case 5:R=.5,M=D,T=I;break}return[Math.floor(R*255+50+g()*100),Math.floor(M*255+50+g()*100),Math.floor(T*255+50+g()*100),255]}};for(let S=0;S<p;S++)for(let C=0;C<p&&!(d.length>=s);C++){const R=C*b+b/2,M=S*y+y/2,T=(g()*2-1)*l*b,A=(g()*2-1)*l*y;d.push({x:Math.floor(R+T),y:Math.floor(M+A)}),n&&d.length-1<n.length?m.push(n[d.length-1]):m.push(w(d.length-1))}const x=(S,C,R,M)=>{let T=Math.abs(S-R),A=Math.abs(C-M);T=Math.min(T,t-T),A=Math.min(A,e-A);const k=Math.sqrt(T*T+A*A),P=T+A;return k*.8+P*.2};for(let S=0;S<e;S++)for(let C=0;C<t;C++){const R=(S*t+C)*4;let M=1/0,T=1/0,A=0;for(let D=0;D<d.length;D++){const I=x(C,S,d[D].x,d[D].y);I<M?(T=M,M=I,A=D):I<T&&(T=I)}for(let D=0;D<d.length;D++)for(let I=-1;I<=1;I++)for(let X=-1;X<=1;X++){if(I===0&&X===0)continue;const Z=d[D].x+I*t,Q=d[D].y+X*e,H=Math.sqrt(Math.pow(C-Z,2)+Math.pow(S-Q,2));H<M?(T=M,M=H,A=D):H<T&&(T=H)}T-M<o?h.set(r,R):h.set(m[A],R)}return h}static penrose(t,e,i={}){return $e(t,e,i)}}const it={tokens:{unaryNot:["!","~","¬","NOT"],and:["&","∧","AND"],nand:["NAND"],or:["|","∨","OR"],nor:["NOR"],xor:["^","⊕","XOR"],xnor:["XNOR"]},precedence:{OR:1,NOR:1,XOR:2,XNOR:2,AND:3,NAND:3,NOT:4},constants:{true:["1","TRUE"],false:["0","FALSE"]}};function at(f){return!!f}function kt(f){return String(f).toUpperCase()}function Ke(f){const t=[],e=String(f??"");let i=0;const s=o=>o===" "||o===`
`||o==="	"||o==="\r",n=o=>o>="A"&&o<="Z"||o>="a"&&o<="z"||o==="_",r=o=>n(o)||o>="0"&&o<="9";for(;i<e.length;){const o=e[i];if(s(o)){i++;continue}if(o==="("){t.push({type:"lp",value:o}),i++;continue}if(o===")"){t.push({type:"rp",value:o}),i++;continue}if(o==="!"||o==="~"||o==="¬"||o==="&"||o==="∧"||o==="|"||o==="∨"||o==="^"||o==="⊕"){t.push({type:"op",value:o}),i++;continue}if(n(o)||o>="0"&&o<="9"){let a=i+1;for(;a<e.length&&r(e[a]);)a++;const l=e.slice(i,a),c=kt(l);it.constants.true.includes(c)||it.constants.false.includes(c)?t.push({type:"const",value:c}):it.tokens.unaryNot.includes(c)||it.tokens.and.includes(c)||it.tokens.nand.includes(c)||it.tokens.or.includes(c)||it.tokens.nor.includes(c)||it.tokens.xor.includes(c)||it.tokens.xnor.includes(c)?t.push({type:"op",value:c}):t.push({type:"ident",value:l}),i=a;continue}throw new Error(`[BooleanAlgebra] Unexpected character "${o}" at ${i}`)}return t}function Ie(f){const t=kt(f);if(it.tokens.unaryNot.map(kt).includes(t))return"NOT";if(it.tokens.and.map(kt).includes(t))return"AND";if(it.tokens.nand.map(kt).includes(t))return"NAND";if(it.tokens.or.map(kt).includes(t))return"OR";if(it.tokens.nor.map(kt).includes(t))return"NOR";if(it.tokens.xor.map(kt).includes(t))return"XOR";if(it.tokens.xnor.map(kt).includes(t))return"XNOR";throw new Error(`[BooleanAlgebra] Unknown operator "${f}"`)}function Je(f){return it.precedence[f]??0}function Qe(f){let t=0;const e=()=>f[t],i=()=>f[t++];function s(){const o=i();if(!o)throw new Error("[BooleanAlgebra] Unexpected end of input");if(o.type==="const"){const a=kt(o.value);return{type:"const",value:it.constants.true.includes(a)}}if(o.type==="ident")return{type:"var",name:o.value};if(o.type==="lp"){const a=n(0),l=i();if(!l||l.type!=="rp")throw new Error("[BooleanAlgebra] Missing closing ')'");return a}if(o.type==="op"){if(Ie(o.value)!=="NOT")throw new Error(`[BooleanAlgebra] Unexpected binary operator "${o.value}"`);return{type:"not",left:s()}}throw new Error(`[BooleanAlgebra] Unexpected token "${o.type}"`)}function n(o){let a=s();for(;;){const l=e();if(!l||l.type!=="op")break;const c=Ie(l.value);if(c==="NOT")break;const u=Je(c);if(u<o)break;i();const h=n(u+1);a={type:c==="AND"?"and":c==="OR"?"or":c==="XOR"?"xor":c==="NAND"?"nand":c==="NOR"?"nor":"xnor",left:a,right:h}}return a}const r=n(0);if(t<f.length)throw new Error("[BooleanAlgebra] Unexpected trailing tokens");return r}function rt(f,t){switch(f.type){case"const":return!!f.value;case"var":{const e=(t==null?void 0:t[f.name])??!1;return at(e)}case"not":return!rt(f.left,t);case"and":return rt(f.left,t)&&rt(f.right,t);case"nand":return!(rt(f.left,t)&&rt(f.right,t));case"or":return rt(f.left,t)||rt(f.right,t);case"nor":return!(rt(f.left,t)||rt(f.right,t));case"xor":{const e=rt(f.left,t),i=rt(f.right,t);return e&&!i||!e&&i}case"xnor":{const e=rt(f.left,t),i=rt(f.right,t);return e===i}default:throw new Error(`[BooleanAlgebra] Unknown AST node type "${f.type}"`)}}function ye(f,t){f&&(f.type==="var"&&f.name&&t.add(f.name),f.left&&ye(f.left,t),f.right&&ye(f.right,t))}function Pe(f){const t=1<<f,e=new Array(t);for(let i=0;i<t;i++)e[i]=i^i>>1;return e}class jt{static and(t,e){return at(t)&&at(e)}static nand(t,e){return!(at(t)&&at(e))}static or(t,e){return at(t)||at(e)}static nor(t,e){return!(at(t)||at(e))}static xor(t,e){const i=at(t),s=at(e);return i&&!s||!i&&s}static xnor(t,e){return at(t)===at(e)}static not(t){return!at(t)}static parse(t){return Qe(Ke(t))}static evaluate(t,e={}){const i=typeof t=="string"?jt.parse(t):t;return rt(i,e)}static variables(t){const e=typeof t=="string"?jt.parse(t):t,i=new Set;return ye(e,i),[...i].sort((s,n)=>s.localeCompare(n))}static grayCode(t){return Pe(t)}static truthTable(t,e,i={}){const s=typeof t=="string"?jt.parse(t):t,n=e&&e.length>0?[...e]:jt.variables(s),r=n.length,o=1<<r,a=i.order==="gray"?"gray":"binary",c=(a==="gray"?Pe(r):Array.from({length:o},(u,h)=>h)).map(u=>{const h={};for(let d=0;d<r;d++){const m=1<<r-1-d;h[n[d]]=!!(u&m)}return{index:u,inputs:h,output:rt(s,h)}});return{variables:n,order:a,rows:c}}}class Et{static lerp(t,e,i){return t+(e-t)*i}static linear(t){return t}static smoothstep(t){return t*t*(3-2*t)}static smootherstep(t){return t*t*t*(t*(t*6-15)+10)}static easeInQuad(t){return t*t}static easeOutQuad(t){return t*(2-t)}static easeInOutQuad(t){return t<.5?2*t*t:-1+(4-2*t)*t}static easeInCubic(t){return t*t*t}static easeOutCubic(t){return--t*t*t+1}static easeInOutCubic(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1}static easeInQuart(t){return t*t*t*t}static easeOutQuart(t){return 1- --t*t*t*t}static easeInOutQuart(t){return t<.5?8*t*t*t*t:1-8*--t*t*t*t}static easeInSine(t){return 1-Math.cos(t*Math.PI/2)}static easeOutSine(t){return Math.sin(t*Math.PI/2)}static easeInOutSine(t){return-(Math.cos(Math.PI*t)-1)/2}static easeInExpo(t){return t===0?0:Math.pow(2,10*(t-1))}static easeOutExpo(t){return t===1?1:1-Math.pow(2,-10*t)}static easeInOutExpo(t){return t===0||t===1?t:t<.5?.5*Math.pow(2,20*t-10):.5*(2-Math.pow(2,-20*t+10))}static easeInCirc(t){return 1-Math.sqrt(1-t*t)}static easeOutCirc(t){return Math.sqrt(1- --t*t)}static easeInOutCirc(t){return t<.5?.5*(1-Math.sqrt(1-4*t*t)):.5*(Math.sqrt(-(2*t-3)*(2*t-1))+1)}static easeInElastic(t,e=1,i=.3){if(t===0||t===1)return t;const s=i/(2*Math.PI)*Math.asin(1/e);return-(e*Math.pow(2,10*(t-1))*Math.sin((t-1-s)*(2*Math.PI)/i))}static easeOutElastic(t,e=1,i=.3){if(t===0||t===1)return t;const s=i/(2*Math.PI)*Math.asin(1/e);return e*Math.pow(2,-10*t)*Math.sin((t-s)*(2*Math.PI)/i)+1}static easeInOutElastic(t,e=1,i=.3){if(t===0||t===1)return t;const s=i/(2*Math.PI)*Math.asin(1/e);return t<.5?-.5*(e*Math.pow(2,10*(2*t-1))*Math.sin((2*t-1-s)*(2*Math.PI)/i)):e*Math.pow(2,-10*(2*t-1))*Math.sin((2*t-1-s)*(2*Math.PI)/i)*.5+1}static easeInBack(t,e=1.70158){return t*t*((e+1)*t-e)}static easeOutBack(t,e=1.70158){return--t*t*((e+1)*t+e)+1}static easeInOutBack(t,e=1.70158){const i=e*1.525;return t<.5?.5*(2*t)*(2*t)*((i+1)*2*t-i):.5*((2*t-2)*(2*t-2)*((i+1)*(2*t-2)+i)+2)}static easeOutBounce(t){return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}static easeInBounce(t){return 1-Et.easeOutBounce(1-t)}static easeInOutBounce(t){return t<.5?Et.easeInBounce(t*2)*.5:Et.easeOutBounce(t*2-1)*.5+.5}}function Be(f,t,e){const i=Math.max(0,Math.min(1,(e-f)/(t-f)));return Et.smoothstep(i)}function ts(f,t,e){const{heatZone:i,coolZone:s,rate:n,heatMultiplier:r=1.5,coolMultiplier:o=1.5,middleMultiplier:a=.05,transitionWidth:l=.1}=e,c=Be(i-l,i+l*.5,f),u=1-Be(s-l*.5,s+l,f),h=1-c-u;let d=0;return c>0&&(d+=(1-t)*n*r*c),u>0&&(d+=(0-t)*n*o*u),h>0&&(d+=(f-t)*n*a*h),Math.max(0,Math.min(1,t+d))}function es(f,t,e){return(f-t)*e}function is(f,t,e){const i=f/t;return e*i}function ss(f,t,e,i,s){return e>=i?0:(t-f)*s}const At=class O{static disableAll(){O.enabledClasses=new Set,O.globalLevel=0}static disable(){O.enabled=!1}static enable(){O.enabled=!0}static setLevel(t){O.globalLevel=t}static enableFor(t){O.enabledClasses.add(t)}static disableFor(t){O.enabledClasses.delete(t)}static setOutput(t){O.output=t}constructor(t){this.className=t}static getLogger(t){return O.loggerz[t]||(O.loggerz[t]=new O(t)),O.loggerz[t]}_log(t,e,...i){O.enabled&&(O.globalLevel>=t||O.enabledClasses.has(this.className))&&O.output[e](`[${this.className}]`,...i)}log(...t){this._log(O.INFO,"log",...t)}warn(...t){this._log(O.WARN,"warn",...t)}error(...t){this._log(O.ERROR,"error",...t)}debug(...t){this._log(O.DEBUG,"log",...t)}table(...t){this._log(O.INFO,"table",...t)}groupCollapsed(t){O.enabled&&O.output.groupCollapsed(`[${this.className}] ${t}`)}groupEnd(){O.enabled&&O.output.groupEnd()}time(t){O.enabled&&O.output.time(`[${this.className}] ${t}`)}timeEnd(t){O.enabled&&O.output.timeEnd(`[${this.className}] ${t}`)}clear(){O.output.clear()}};E(At,"ERROR",1);E(At,"WARN",2);E(At,"INFO",3);E(At,"DEBUG",4);E(At,"globalLevel",At.ERROR);E(At,"enabledClasses",new Set);E(At,"output",console);E(At,"enabled",!0);E(At,"loggerz",[]);let St=At;class Ye{constructor(t={}){this.name=t.name||this.constructor.name,this._logger=this.getLogger(t)}get logger(){return this._logger==null?this.getLogger():this._logger}trace(t="render"){this.logger.log(this.name==null?this.constructor.name:this.name,t,"x",this.x,"y",this.y,"w",this.width,"h",this.height,"opacity",this._opacity,"visible",this._visible,"active",this._active,"debug",this.debug)}getLogger(t){return St.getLogger(t.name||this.constructor.name)}}const ti=class Kt{static getInstance(){return Kt.instance||(Kt.instance=new Kt),Kt.instance}constructor(){this.createTab()}createTab(){this.tab=document.createElement("div"),Object.assign(this.tab.style,{position:"fixed",bottom:"0",left:"0",right:"0",height:"30px",backgroundColor:"#333",color:"#fff",padding:"5px",cursor:"pointer",fontFamily:"monospace",zIndex:"10000",display:"flex",justifyContent:"space-between",alignItems:"center"}),this.tab.innerText="Console";const t=document.createElement("div"),e=(i,s)=>{const n=document.createElement("button");return n.innerText=i,Object.assign(n.style,{marginLeft:"5px",padding:"2px 5px",fontFamily:"monospace",cursor:"pointer"}),n.onclick=s,n};this.paused=!1,this.scrollLock=!0,t.appendChild(e("Clear",()=>this.consoleArea.value="")),t.appendChild(e("Pause",()=>this.paused=!this.paused)),t.appendChild(e("Scroll Lock",()=>this.scrollLock=!this.scrollLock)),this.tab.appendChild(t),document.body.appendChild(this.tab),this.consoleArea=document.createElement("textarea"),Object.assign(this.consoleArea.style,{position:"fixed",bottom:"30px",left:"0",right:"0",height:"200px",display:"none",backgroundColor:"#111",color:"#0f0",fontFamily:"monospace",zIndex:"9999",padding:"10px",resize:"none"}),this.consoleArea.readOnly=!0,document.body.appendChild(this.consoleArea),this.tab.onclick=i=>{i.target===this.tab&&(this.consoleArea.style.display=this.consoleArea.style.display==="none"?"block":"none")}}appendMessage(t,e,...i){if(this.paused)return;const s=`[${t.toUpperCase()}] ${e} ${i.join(" ")}
`;this.consoleArea.value+=s,this.scrollLock&&(this.consoleArea.scrollTop=this.consoleArea.scrollHeight)}log(t,...e){this.appendMessage("log",t,...e)}warn(t,...e){this.appendMessage("warn",t,...e)}error(t,...e){this.appendMessage("error",t,...e)}table(t){const e=JSON.stringify(t,null,2);this.appendMessage("table",e)}groupCollapsed(t){this.appendMessage("group",`Group Start: ${t}`)}groupEnd(){this.appendMessage("group","Group End")}time(t){this[`time_${t}`]=performance.now()}timeEnd(t){const e=performance.now(),i=this[`time_${t}`],s=(e-i).toFixed(2);this.appendMessage("time",`${t}: ${s} ms`)}};E(ti,"instance");const Re=class dt{static dropShadow(t,e,i=0,s=0){v.ctx.shadowColor=t,v.ctx.shadowBlur=e,v.ctx.shadowOffsetX=i,v.ctx.shadowOffsetY=s}static clearShadow(){v.ctx.shadowColor="rgba(0, 0, 0, 0)",v.ctx.shadowBlur=0,v.ctx.shadowOffsetX=0,v.ctx.shadowOffsetY=0}static setAlpha(t){v.ctx.globalAlpha=t}static setBlendMode(t){v.ctx.globalCompositeOperation=t}static clipRect(t,e,i,s){v.ctx.beginPath(),v.ctx.rect(t,e,i,s),v.ctx.clip()}static clipCircle(t,e,i){v.ctx.beginPath(),v.shapes.arc(t,e,i,0,Math.PI*2),v.ctx.clip()}static blurRegion(t,e,i,s,n){const r=v.ctx.filter;v.ctx.filter=`blur(${n}px)`;const o=v.ctx.getImageData(t,e,i,s);v.ctx.putImageData(o,t,e),v.ctx.filter=r}static createGlow(t,e,i={}){const s="glow-"+Math.random().toString(36).substr(2,9),r={...{pulseSpeed:0,pulseMin:e*.5,pulseMax:e*1.5,colorShift:0},...i},o={id:s,type:"glow",active:!0,time:0,color:t,blur:e,options:r,update(a){return Object.assign(this,a),this},stop(){return this.active=!1,dt._activeEffects.delete(this.id),this},apply(){if(!this.active)return;let a=this.blur,l=this.color;if(this.options.pulseSpeed>0){const c=Math.sin(this.time*this.options.pulseSpeed)*.5+.5;a=this.options.pulseMin+c*(this.options.pulseMax-this.options.pulseMin)}return this.options.colorShift>0&&(l=l.replace("hue",this.time*this.options.colorShift%360)),v.ctx.shadowColor=l,v.ctx.shadowBlur=a,v.ctx.shadowOffsetX=0,v.ctx.shadowOffsetY=0,this.time+=1/60,this}};return dt._activeEffects.set(s,o),dt._startAnimationLoop(),o}static _startAnimationLoop(){if(dt._animationId!==null)return;const t=()=>{if(dt._activeEffects.forEach(e=>{e.active&&e.apply()}),dt._activeEffects.size===0){cancelAnimationFrame(dt._animationId),dt._animationId=null;return}dt._animationId=requestAnimationFrame(t)};dt._animationId=requestAnimationFrame(t)}static clearAllEffects(){dt._activeEffects.forEach(t=>t.stop()),dt._activeEffects.clear(),v.ctx.shadowColor="rgba(0, 0, 0, 0)",v.ctx.shadowBlur=0,v.ctx.shadowOffsetX=0,v.ctx.shadowOffsetY=0,v.ctx.filter="none",v.ctx.globalAlpha=1,v.ctx.globalCompositeOperation="source-over"}};E(Re,"_activeEffects",new Map);E(Re,"_animationId",null);let ei=Re;class ii{static draw(t,e=0,i=0,{width:s,height:n,crop:r=null,anchor:o="top‑left",rotation:a=0,scaleX:l=1,scaleY:c=1,flipX:u=!1,flipY:h=!1,alpha:d=1,smoothing:m=!0}={}){const g=v.ctx;if(!g||!t)return;const p=s??(r?r.sw:t.width??t.videoWidth),b=n??(r?r.sh:t.height??t.videoHeight),y={left:0,center:.5,right:1}[o.split("-").pop()]??0,w={top:0,center:.5,bottom:1}[o.split("-")[0]]??0,x=-p*y,S=-b*w;if(g.save(),g.imageSmoothingEnabled=m,g.globalAlpha*=d,g.translate(e,i),a&&g.rotate(a),(u||h)&&g.scale(u?-1:1,h?-1:1),g.scale(l,c),r){const{sx:C,sy:R,sw:M,sh:T}=r;g.drawImage(t,C,R,M,T,x,S,p,b)}else g.drawImage(t,x,S,p,b);g.restore()}static blit(t,e,i,s,n){this.draw(t,e,i,{width:s,height:n})}static createPattern(t,e="repeat"){return v.ctx.createPattern(t,e)}static fillPattern(t,e,i,s,n){const r=v.ctx;r.save(),r.fillStyle=t,r.fillRect(e,i,s,n),r.restore()}static createImageData(t,e){return v.ctx.createImageData(t,e)}static cloneImageData(t){return new ImageData(new Uint8ClampedArray(t.data),t.width,t.height)}static getImageData(t,e,i,s){return v.ctx.getImageData(t,e,i,s)}static putImageData(t,e,i,s=0,n=0,r=t.width,o=t.height){v.ctx.putImageData(t,e,i,s,n,r,o)}static mapPixels(t,e){const i=t.data;for(let s=0;s<i.length;s+=4){const n=s>>2,r=e(i[s],i[s+1],i[s+2],i[s+3],n);r&&([i[s],i[s+1],i[s+2],i[s+3]]=r)}return t}static setPixel(t,e,i,s,n,r,o=255){const a=(i*t.width+e)*4,l=t.data;l[a]=s,l[a+1]=n,l[a+2]=r,l[a+3]=o}static async toBitmap({type:t="image/png",quality:e=.92}={}){const s=await v.ctx.canvas.convertToBlob({type:t,quality:e});return createImageBitmap(s)}static async createBitmap(t){return createImageBitmap(t)}static toImageData(t,e,i){if(t.length!==e*i*4)throw new Error("Invalid RGBA array size for given dimensions");return new ImageData(t,e,i)}static async createImageBitmapFromPixels(t,e,i){const s=this.toImageData(t,e,i);return await createImageBitmap(s)}static createPatternFromImageData(t,e="repeat"){const i=document.createElement("canvas");i.width=t.width,i.height=t.height;const s=i.getContext("2d");return s.putImageData(t,0,0),s.createPattern(i,e)}static createPatternFromPixels(t,e,i,s="repeat"){const n=this.toImageData(t,e,i);return this.createPatternFromImageData(n,s)}}class si{static path(t,e,i,s=1){const n=v.ctx;n.beginPath();for(const r of t){const[o,...a]=r;o==="M"?n.moveTo(...a):o==="L"?n.lineTo(...a):o==="C"?n.bezierCurveTo(...a):o==="Q"?n.quadraticCurveTo(...a):o==="Z"&&n.closePath()}e&&(n.fillStyle=e,v.colors.fill(e)),i&&(n.strokeStyle=i,n.lineWidth=s,v.colors.stroke())}static line(t,e,i,s,n,r){v.ctx.beginPath(),v.ctx.moveTo(t,e),v.ctx.lineTo(i,s),v.colors.stroke(n,r)}static beginPath(){v.ctx.beginPath()}static closePath(){v.ctx.closePath()}static moveTo(t,e){v.ctx.moveTo(t,e)}static lineTo(t,e){v.ctx.lineTo(t,e)}static bezierCurveTo(t,e,i,s,n,r){v.ctx.bezierCurveTo(t,e,i,s,n,r)}static dashedLine(t,e,i,s,n,r,o){v.ctx.beginPath(),r&&(v.ctx.strokeStyle=r),o!==void 0&&(v.ctx.lineWidth=o),v.ctx.setLineDash(n),v.ctx.moveTo(t,e),v.ctx.lineTo(i,s),v.colors.stroke(),v.ctx.setLineDash([])}static dottedLine(t,e,i,s,n=2,r=5,o){return v.lines.dashedLine(t,e,i,s,[n,r],o,n)}static setLineDash(t){v.ctx.setLineDash(t)}static resetLineDash(){v.ctx.setLineDash([])}static setLineWidth(t){v.ctx.lineWidth=t}static quadraticCurve(t,e,i,s,n,r,o,a){v.ctx.beginPath(),v.ctx.moveTo(t,e),v.ctx.quadraticCurveTo(i,s,n,r),o&&(v.ctx.strokeStyle=o),a!==void 0&&(v.ctx.lineWidth=a),v.colors.stroke()}}class Le{static pushOpacity(t){const i=this._opacityStack[this._opacityStack.length-1]*t;this._opacityStack.push(i),v.logger.log("NEXT OPACITY WILL BE",i),v.effects.setAlpha(i)}static popOpacity(){if(this._opacityStack.length>1){this._opacityStack.pop();const t=this._opacityStack[this._opacityStack.length-1];v.logger.log("NEXT OPACITY WILL BE",t),v.effects.setAlpha(t)}}static _clone(){this._opacityStack=[...this._opacityStack]}static saveOpacityState(){this._opacityStateBackup=[...this._opacityStack]}static restoreOpacityState(){this._opacityStateBackup&&(this._opacityStack=this._opacityStateBackup,delete this._opacityStateBackup)}}E(Le,"_opacityStack",[1]);class oi{static rect(t,e,i,s,n){const r=v.ctx.fillStyle;v.colors.fill(n),v.ctx.fillRect(t,e,i,s),v.ctx.fillStyle=r}static outlineRect(t,e,i,s,n,r=1){const o=v.ctx.strokeStyle,a=v.ctx.lineWidth;v.ctx.strokeStyle=n,v.ctx.lineWidth=r,v.ctx.strokeRect(t,e,i,s),v.ctx.strokeStyle=o,v.ctx.lineWidth=a}static roundRect(t,e,i,s,n=0,r,o,a){let l;typeof n=="number"?l=[n,n,n,n]:Array.isArray(n)?l=n.length===4?n:[n[0]||0,n[1]||n[0]||0,n[2]||n[0]||0,n[3]||n[1]||n[0]||0]:l=[0,0,0,0];const[c,u,h,d]=l,m=t+i,g=e+s;v.lines.beginPath(),v.lines.moveTo(t+c,e),v.lines.lineTo(m-u,e),this.arc(m-u,e+u,u,-Math.PI/2,0),v.lines.lineTo(m,g-h),this.arc(m-h,g-h,h,0,Math.PI/2),v.lines.lineTo(t+d,g),this.arc(t+d,g-d,d,Math.PI/2,Math.PI),v.lines.lineTo(t,e+c),this.arc(t+c,e+c,c,Math.PI,-Math.PI/2),v.lines.closePath(),r&&(v.fillStyle=r,v.colors.fill(r)),o&&v.colors.stroke(o,a)}static fillRoundRect(t,e,i,s,n=0,r){this.roundRect(t,e,i,s,n,r,null)}static strokeRoundRect(t,e,i,s,n=0,r,o){this.roundRect(t,e,i,s,n,null,r,o)}static fillCircle(t,e,i,s){v.logger.log("PainterShapes.fillCircle",t,e,i,s),v.lines.beginPath(),this.arc(t,e,i,0,Math.PI*2),v.colors.fill(s)}static arc(t,e,i,s,n,r){v.ctx.arc(t,e,i,s,n,r)}static strokeCircle(t,e,i,s,n){v.lines.beginPath(),this.arc(t,e,i,0,Math.PI*2),v.colors.stroke(s,n)}static fillEllipse(t,e,i,s,n=0,r){v.lines.beginPath(),this.ellipse(t,e,i,s,n,0,Math.PI*2),r&&(v.fillStyle=r),v.colors.fill(r)}static strokeEllipse(t,e,i,s,n=0,r,o){v.lines.beginPath(),this.ellipse(t,e,i,s,n,0,Math.PI*2),r&&(v.strokeStyle=r),o!==void 0&&(v.lineWidth=o),v.colors.stroke(r,o)}static ellipse(t,e,i,s,n,r,o,a){v.ctx.ellipse(t,e,i,s,n,r,o,a)}static polygon(t,e,i,s){if(!(t.length<2)){v.lines.beginPath(),v.lines.moveTo(t[0].x,t[0].y);for(let n=1;n<t.length;n++)v.lines.lineTo(t[n].x,t[n].y);v.lines.closePath(),e&&v.colors.fill(e),i&&v.colors.stroke(i,s)}}}class ni{static font(){return v.ctx.font}static setFont(t){v.ctx.font=t}static setTextAlign(t){v.ctx.textAlign=t}static setTextBaseline(t){v.ctx.textBaseline=t}static fillText(t,e,i,s,n){s&&(v.ctx.fillStyle=s),n&&(v.ctx.font=n),v.ctx.fillText(t,e,i)}static strokeText(t,e,i,s,n,r){s&&(v.ctx.strokeStyle=s),n!==void 0&&(v.ctx.lineWidth=n),r&&(v.ctx.font=r),v.ctx.strokeText(t,e,i)}static measureTextDimensions(t,e,i="start",s="alphabetic"){e&&(v.ctx.font=e);const n=v.ctx.measureText(t),r=n.width,o=n.actualBoundingBoxAscent+n.actualBoundingBoxDescent;let a=0;return s==="middle"&&(a=-1.5),{width:r,height:o,verticalAdjustment:a}}static measureTextWidth(t,e){return e&&(v.ctx.font=e),v.ctx.measureText(t).width}static outlinedText(t,e,i,s,n,r,o){o&&(v.ctx.font=o),v.ctx.strokeStyle=n,v.ctx.lineWidth=r,v.ctx.strokeText(t,e,i),v.ctx.fillStyle=s,v.ctx.fillText(t,e,i)}static wrappedText(t,e,i,s,n,r,o){r&&(v.ctx.fillStyle=r),o&&(v.ctx.font=o);const a=t.split(" ");let l="",c="",u=1;for(let h=0;h<a.length;h++)c=l+a[h]+" ",v.ctx.measureText(c).width>s&&h>0?(v.ctx.fillText(l,e,i),l=a[h]+" ",i+=n,u++):l=c;return v.ctx.fillText(l,e,i),u*n}static textOnPath(t,e,i,s,n=!1){if(e.length<2)return;i&&(v.ctx.fillStyle=i),s&&(v.ctx.font=s);const r=t.split(""),o=r.map(h=>v.ctx.measureText(h).width);n&&(r.reverse(),o.reverse(),e.reverse());let a=0;for(let h=1;h<e.length;h++){const d=e[h].x-e[h-1].x,m=e[h].y-e[h-1].y;a+=Math.sqrt(d*d+m*m)}const l=o.reduce((h,d)=>h+d,0);let c=(a-l)/2;c<0&&(c=0);let u=c;for(let h=0;h<r.length;h++){const d=o[h],{x:m,y:g,angle:p}=getPositionOnPath(e,u);v.ctx.save(),v.ctx.translate(m,g),v.ctx.rotate(p),v.ctx.fillText(r[h],0,0),v.ctx.restore(),u+=d}}static getPositionOnPath(t,e){let i=0;for(let o=1;o<t.length;o++){const a=t[o-1],l=t[o],c=l.x-a.x,u=l.y-a.y,h=Math.sqrt(c*c+u*u);if(i+h>=e){const d=(e-i)/h,m=a.x+c*d,g=a.y+u*d,p=Math.atan2(u,c);return{x:m,y:g,angle:p}}i+=h}const s=t[t.length-1],n=t[t.length-2],r=Math.atan2(s.y-n.y,s.x-n.x);return{x:s.x,y:s.y,angle:r}}}const Pt=class mt{static get colors(){return K(this,Xt,Ot).call(this,"colors",_(this,Jt)),_(this,Jt)}static get effects(){return K(this,Xt,Ot).call(this,"effects",_(this,Qt)),_(this,Qt)}static get img(){return K(this,Xt,Ot).call(this,"img",_(this,te)),_(this,te)}static get lines(){return K(this,Xt,Ot).call(this,"lines",_(this,ee)),_(this,ee)}static get opacity(){return K(this,Xt,Ot).call(this,"opacity",_(this,ie)),_(this,ie)}static get shapes(){return K(this,Xt,Ot).call(this,"shapes",_(this,se)),_(this,se)}static get text(){return K(this,Xt,Ot).call(this,"text",_(this,oe)),_(this,oe)}static set ctx(t){this._ctx=t}static get ctx(){if(!this._ctx)throw new Error("Cannot access Painter.ctx before initialization!");return this._ctx}static init(t){this._ctx=t,this.saveStack=[],N(this,Jt,ri),N(this,Qt,ei),N(this,te,ii),N(this,ee,si),N(this,ie,Le),N(this,se,oi),N(this,oe,ni),mt.logger=St.getLogger("Painter"),mt.saveStack=[]}static setContext(t){this._ctx=t}static save(){const e=(new Error().stack.split(`
`)[2]||"").match(/at\s+(\w+)\.(\w+)/),i=e?`${e[1]}.${e[2]}`:"unknown";this.saveStack.push(i),this.logger.log(`Painter.save() by: ${i}`),this.ctx.save(),mt.opacity.saveOpacityState()}static restore(){if(this.saveStack.length===0){console.error("PAINTER ERROR: restore() without matching save()!");return}const t=this.saveStack.pop();this.logger.log(`Painter.restore() balancing save from: ${t}`),this.ctx.restore(),mt.opacity.restoreOpacityState()}static translateTo(t,e){(isNaN(t)||t===void 0)&&(t=0),(isNaN(e)||e===void 0)&&(e=0),this.logger.log("moveTo",t,e),this.ctx.translate(t,e)}static resetPosition(){this.logger.log("resetPosition");const t=this.ctx.getTransform();this.ctx.setTransform(t.a,t.b,t.c,t.d,0,0)}static withPosition(t,e,i){this.logger.log("withPosition",t,e),this.save(),this.translateTo(t,e),i(),this.restore()}static clear(t=0,e=0,i=mt.ctx.canvas.width,s=mt.ctx.canvas.height){mt.ctx.clearRect(t,e,i,s)}static translate(t,e){mt.ctx.translate(t,e)}static rotate(t){mt.logger.log("Painter.rotate",t),mt.ctx.rotate(t)}static scale(t,e){mt.logger.log("Painter.scale",t,e),mt.ctx.scale(t,e)}static useCtx(t,e={}){const i=this.ctx,{saveState:s=!1}=e;s&&this.save(),i.beginPath(),t(i),i.beginPath(),s&&this.restore()}};Jt=new WeakMap;Qt=new WeakMap;te=new WeakMap;ee=new WeakMap;ie=new WeakMap;se=new WeakMap;oe=new WeakMap;Xt=new WeakSet;Ot=function(f,t){if(!t)throw new Error(`Painter.${f} is not initialized. Call Painter.init(ctx) first.`)};Y(Pt,Xt);Y(Pt,Jt,null);Y(Pt,Qt,null);Y(Pt,te,null);Y(Pt,ee,null);Y(Pt,ie,null);Y(Pt,se,null);Y(Pt,oe,null);E(Pt,"logger");let v=Pt;class ri{static fill(t){v.logger.log("PainterColors.fill - before:",v.ctx.fillStyle,"setting to:",t),v.ctx.fillStyle,v.ctx.fillStyle=t,v.ctx.fill(),v.logger.log("PainterColors.fill - after:",v.ctx.fillStyle)}static strokeOptions(t){t.color&&(v.ctx.strokeStyle=t.color),t.lineWidth!==void 0&&(v.ctx.lineWidth=t.lineWidth),t.lineCap&&(v.ctx.lineCap=t.lineCap),t.lineJoin&&(v.ctx.lineJoin=t.lineJoin),t.strokeStyle&&(v.ctx.strokeStyle=t.strokeStyle)}static stroke(t,e){t&&(v.ctx.strokeStyle=t),e!==void 0&&(v.ctx.lineWidth=e),v.ctx.stroke()}static setFillColor(t){v.ctx.fillStyle=t}static setStrokeColor(t){v.ctx.strokeStyle=t}static randomColorRGB(){const t=Math.floor(Math.random()*360),e=70+Math.floor(Math.random()*30),i=50+Math.floor(Math.random()*20);return v.colors.hslToRgb(t,e,i)}static randomColorRGBA(t=255){const[e,i,s]=this.randomColorRGB();return[e,i,s,t]}static randomColorHSL(){return`hsl(${Math.random()*360}, 100%, 50%)`}static randomColorHSL_RGBA(t=255){const e=Math.random()*360,i=60+Math.random()*40,s=40+Math.random()*40,[n,r,o]=v.colors.hslToRgb(e,i,s);return[n,r,o,t]}static randomColorHEX(){return"#"+(Math.random()*1048575*1e6).toString(16).slice(0,6)}static parseColorString(t){if(t=t.trim().toLowerCase(),t.startsWith("hsl")){const e=t.replace(/hsla?\(|\)/g,""),[i,s,n]=e.split(",").map(l=>l.trim()),r=parseFloat(i),o=parseFloat(s)/100,a=parseFloat(n)/100;return v.colors.hslToRgb(r,o,a)}if(t.startsWith("#"))return hexToRgb(t);if(t.startsWith("rgb")){const e=t.replace(/rgba?\(|\)/g,""),[i,s,n]=e.split(",").map(r=>parseInt(r.trim()));return[i,s,n]}return[0,0,0]}static rgbArrayToCSS([t,e,i]){return`rgb(${Math.round(t)}, ${Math.round(e)}, ${Math.round(i)})`}static hslToRgb(t,e,i){e/=100,i/=100;const s=o=>(o+t/30)%12,n=e*Math.min(i,1-i),r=o=>i-n*Math.max(-1,Math.min(s(o)-3,Math.min(9-s(o),1)));return[Math.round(r(0)*255),Math.round(r(8)*255),Math.round(r(4)*255)]}static rgbToHsl(t,e,i){t/=255,e/=255,i/=255;const s=Math.max(t,e,i),n=Math.min(t,e,i),r=s-n;let o=0,a=0,l=(s+n)/2;if(r!==0)switch(a=r/(1-Math.abs(2*l-1)),s){case t:o=60*(((e-i)/r+6)%6);break;case e:o=60*((i-t)/r+2);break;case i:o=60*((t-e)/r+4);break}return[o%360,a,l]}static hexToRgb(t){const e=t.replace("#",""),i=parseInt(e.substring(0,2),16),s=parseInt(e.substring(2,4),16),n=parseInt(e.substring(4,6),16);return[i,s,n]}static linearGradient(t,e,i,s,n){const r=v.ctx.createLinearGradient(t,e,i,s);for(const o of n)r.addColorStop(o.offset,o.color);return r}static radialGradient(t,e,i,s,n,r,o){const a=v.ctx.createRadialGradient(t,e,i,s,n,r);for(const l of o)a.addColorStop(l.offset,l.color);return a}static verticalGradient(t,e,i,s,n){return v.colors.linearGradient(t,e,t,e+s,n)}static horizontalGradient(t,e,i,s,n){return v.colors.linearGradient(t,e,t+i,e,n)}static conicGradient(t,e,i,s){if(typeof v.ctx.createConicGradient=="function"){const n=v.ctx.createConicGradient(i,t,e);for(const r of s)n.addColorStop(r.offset,r.color);return n}return null}static rgba(t,e,i,s=1){return`rgba(${Math.round(t)}, ${Math.round(e)}, ${Math.round(i)}, ${s})`}static hsl(t,e,i){return`hsl(${t}, ${e}%, ${i}%)`}static hsla(t,e,i,s){return`hsla(${t}, ${e}%, ${i}%, ${s})`}}class ai extends Ye{constructor(t={}){super(t),this._x=typeof t.x=="number"?t.x:0,this._y=typeof t.y=="number"?t.y:0,this._width=typeof t.width=="number"?t.width:0,this._height=typeof t.height=="number"?t.height:0,this.logger.log("Euclidian",this._x,this._y,this._width,this._height)}get x(){return this._x}set x(t){this.validateProp(t,"x"),this._x=t}get y(){return this._y}set y(t){this.validateProp(t,"y"),this._y=t}get width(){return this._width}set width(t){this.validateProp(t,"width"),this._width=Math.max(0,t)}get height(){return this._height}set height(t){this.validateProp(t,"height"),this._height=Math.max(0,t)}get debug(){return this._debug}set debug(t){this.validateProp(t,"debug"),this._debug=!!t}get debugColor(){return this._debugColor}set debugColor(t){this.validateProp(t,"debugColor"),this._debugColor=t}validateProp(t,e){if(t==null)throw new Error("Invalid property value: "+e+" "+t)}}class li extends ai{constructor(t={}){super(t),this._minX=t.minX,this._maxX=t.maxX,this._minY=t.minY,this._maxY=t.maxY,this._boundsDirty=!0,this._cachedBounds=null,this.crisp=t.crisp??!0,this.logger.log("Geometry2d",this.x,this.y,this.width,this.height)}update(){this.trace("Geometry2d.update"),this.applyConstraints(),this.getBounds()}get minX(){return this._minX}set minX(t){this._minX=t}get maxX(){return this._maxX}set maxX(t){this._maxX=t}get minY(){return this._minY}set minY(t){this._minY=t}get maxY(){return this._maxY}set maxY(t){this._maxY=t}get boundsDirty(){return this._boundsDirty}applyConstraints(){this._minX!==void 0&&(this.x=Math.max(this.x,this._minX)),this._maxX!==void 0&&(this.x=Math.min(this.x,this._maxX)),this._minY!==void 0&&(this.y=Math.max(this.y,this._minY)),this._maxY!==void 0&&(this.y=Math.min(this.y,this._maxY)),this.crisp&&(this.x=Math.round(this.x),this.y=Math.round(this.y),this.width=Math.round(this.width),this.height=Math.round(this.height))}getBounds(){return(this._boundsDirty||!this._cachedBounds)&&(this._cachedBounds=this.calculateBounds(),this._boundsDirty=!1),this._cachedBounds}calculateBounds(){return{width:this.width,height:this.height,x:this.x,y:this.y}}getLocalPosition(){let t=0,e=0;return this.parent&&(t=this.parent.x,e=this.parent.y),{x:this.x-t-this.width/2,y:this.y-e-this.height/2}}markBoundsDirty(){this._boundsDirty=!0}validateProp(t,e){super.validateProp(t,e);const i=this[e];t!==i&&this.markBoundsDirty()}setTopLeft(t,e){return this.x=t+this.width/2,this.y=e+this.height/2,this}setCenter(t,e){return this.x=t,this.y=e,this}}class ci extends li{constructor(t={}){super(t),this._debug=!!t.debug,this._debugColor=typeof t.debugColor=="string"?t.debugColor:"#0f0",this.logger.log("Traceable",this.x,this.y,this.width,this.height)}drawDebug(){if(!this._debug)return;const t=this.getDebugBounds();this.logger.log(this.constructor.name,"drawDebug",t.x,t.y,t.width,t.height),v.shapes.outlineRect(t.x,t.y,t.width,t.height,this._debugColor,2)}getDebugBounds(){return{width:this.width,height:this.height,x:-this.width/2,y:-this.height/2}}trace(t="render"){this.logger.log(this.name==null?this.constructor.name:this.name,t,"x",this.x,"y",this.y,"w",this.width,"h",this.height,"opacity",this._opacity,"visible",this._visible,"active",this._active,"debug",this.debug)}}class hi extends ci{constructor(t={}){super(t),this._visible=t.visible!==!1,this._opacity=typeof t.opacity=="number"?t.opacity:1,this._active=t.active!==!1,this.zIndex=t.zIndex??0,this._shadowColor=t.shadowColor??void 0,this._shadowBlur=t.shadowBlur??0,this._shadowOffsetX=t.shadowOffsetX??0,this._shadowOffsetY=t.shadowOffsetY??0,this._cacheRendering=t.cacheRendering??!1,this._cacheCanvas=null,this._cacheDirty=!0,this._cachePadding=t.cachePadding??2,this._tick=0,this.logger.log("Renderable",this.x,this.y,this.width,this.height)}render(){if(!(!this._visible||this._opacity<=0)){if(v.save(),v.effects.setBlendMode(this._blendMode),this.crisp?v.translateTo(Math.round(this.x),Math.round(this.y)):v.translateTo(this.x,this.y),this.applyShadow(v.ctx),!this._cacheRendering||this.constructor.name==="Renderable")v.opacity.pushOpacity(this._opacity),this.draw(),v.opacity.popOpacity();else{const t=typeof this.width=="number"?this.width:0,e=typeof this.height=="number"?this.height:0,i=this._cachePadding*2,s=Math.ceil(t+i)||1,n=Math.ceil(e+i)||1;(!this._cacheCanvas||this._cacheCanvas.width!==s||this._cacheCanvas.height!==n)&&(this._cacheCanvas=document.createElement("canvas"),this._cacheCanvas.width=s,this._cacheCanvas.height=n,this._cacheDirty=!0),this._cacheDirty&&(this._renderToCache(s,n),this._cacheDirty=!1),v.opacity.pushOpacity(this._opacity);const r=this.rotation??0,o=this.scaleX??1,a=this.scaleY??1;v.img.draw(this._cacheCanvas,0,0,{width:s,height:n,rotation:r,scaleX:o,scaleY:a,anchor:"center"}),v.opacity.popOpacity()}v.restore()}}_renderToCache(t,e){const i=this._cacheCanvas.getContext("2d");i.clearRect(0,0,t,e);const s=v.ctx;v.ctx=i,this._isCaching=!0,i.save(),i.translate(t/2,e/2),this.draw(),i.restore(),this._isCaching=!1,v.ctx=s}invalidateCache(){this._cacheDirty=!0}draw(){this.drawDebug()}update(t){this.trace("Renderable.update"),this._tick+=t,super.update(t)}applyShadow(t){this._shadowColor&&(t.shadowColor=this._shadowColor,t.shadowBlur=this._shadowBlur,t.shadowOffsetX=this._shadowOffsetX,t.shadowOffsetY=this._shadowOffsetY)}get visible(){return this._visible}set visible(t){this._visible=!!t}get width(){return super.width}set width(t){super.width=t,this.invalidateCache()}get height(){return super.height}set height(t){super.height=t,this.invalidateCache()}get active(){return this._active}set active(t){this._active=!!t}get opacity(){return this._opacity}set opacity(t){this._opacity=Math.min(1,Math.max(0,typeof t=="number"?t:1))}get shadowColor(){return this._shadowColor}set shadowColor(t){this._shadowColor=t,this.invalidateCache()}get shadowBlur(){return this._shadowBlur}set shadowBlur(t){this._shadowBlur=t,this.invalidateCache()}get shadowOffsetX(){return this._shadowOffsetX}set shadowOffsetX(t){this._shadowOffsetX=t,this.invalidateCache()}get shadowOffsetY(){return this._shadowOffsetY}set shadowOffsetY(t){this._shadowOffsetY=t,this.invalidateCache()}get tick(){return this._tick}get cacheRendering(){return this._cacheRendering}set cacheRendering(t){this._cacheRendering=!!t,t&&this.invalidateCache()}}const Fe=class _e{constructor(t){this._owner=t}get owner(){return this._owner}x(t){return this._owner._x=t,this._owner.markBoundsDirty(),this}y(t){return this._owner._y=t,this._owner.markBoundsDirty(),this}position(t,e){return this._owner._x=t,this._owner._y=e,this._owner.markBoundsDirty(),this}translateBy(t,e){return this._owner._x+=t,this._owner._y+=e,this._owner.markBoundsDirty(),this}width(t){var e,i;return this._owner._width=Math.max(0,t),this._owner.markBoundsDirty(),(i=(e=this._owner).invalidateCache)==null||i.call(e),this}height(t){var e,i;return this._owner._height=Math.max(0,t),this._owner.markBoundsDirty(),(i=(e=this._owner).invalidateCache)==null||i.call(e),this}size(t,e){var i,s;return this._owner._width=Math.max(0,t),this._owner._height=Math.max(0,e),this._owner.markBoundsDirty(),(s=(i=this._owner).invalidateCache)==null||s.call(i),this}rotation(t){return this._owner._rotation=t*Math.PI/180,this._owner.markBoundsDirty(),this}rotationRad(t){return this._owner._rotation=t,this._owner.markBoundsDirty(),this}rotateBy(t){return this._owner._rotation+=t*Math.PI/180,this._owner.markBoundsDirty(),this}scaleX(t){return this._owner._scaleX=t,this._owner.markBoundsDirty(),this}scaleY(t){return this._owner._scaleY=t,this._owner.markBoundsDirty(),this}scale(t){return this._owner._scaleX=t,this._owner._scaleY=t,this._owner.markBoundsDirty(),this}scaleBy(t){return this._owner._scaleX*=t,this._owner._scaleY*=t,this._owner.markBoundsDirty(),this}set(t){var e,i;let s=!1;return t.x!==void 0&&(this._owner._x=t.x),t.y!==void 0&&(this._owner._y=t.y),t.width!==void 0&&(this._owner._width=Math.max(0,t.width),s=!0),t.height!==void 0&&(this._owner._height=Math.max(0,t.height),s=!0),t.rotation!==void 0&&(this._owner._rotation=t.rotation*Math.PI/180),t.scaleX!==void 0&&(this._owner._scaleX=t.scaleX),t.scaleY!==void 0&&(this._owner._scaleY=t.scaleY),this._owner.markBoundsDirty(),s&&((i=(e=this._owner).invalidateCache)==null||i.call(e)),this}reset(){return this._owner._rotation=0,this._owner._scaleX=1,this._owner._scaleY=1,this._owner.markBoundsDirty(),this}resetAll(){var t,e;return this._owner._x=0,this._owner._y=0,this._owner._width=0,this._owner._height=0,this._owner._rotation=0,this._owner._scaleX=1,this._owner._scaleY=1,this._owner.markBoundsDirty(),(e=(t=this._owner).invalidateCache)==null||e.call(t),this}toObject(){return{x:this._owner._x,y:this._owner._y,width:this._owner._width,height:this._owner._height,rotation:this._owner._rotation*180/Math.PI,scaleX:this._owner._scaleX,scaleY:this._owner._scaleY}}copyFrom(t){const e=t instanceof _e?t.toObject():t;return this.set(e)}static handleDirectSet(t,e){if(_e.strictMode)throw new Error(`Direct property assignment "${t} = ${e}" is disabled. Use shape.transform.${t}(${e}) instead. Set Transform.strictMode = false to allow direct assignment.`);console.warn(`[Deprecation] Direct assignment "${t} = ${e}" is deprecated. Use shape.transform.${t}(${e}) instead.`)}};E(Fe,"strictMode",!1);let ui=Fe;class ue extends hi{constructor(t={}){super(t),this._rotation=t.rotation*Math.PI/180,this._scaleX=t.scaleX??1,this._scaleY=t.scaleY??1,this.transform=new ui(this),this.logger.log("Transformable",this.x,this.y,this.width,this.height)}draw(){this.applyTransforms(),this.drawDebug()}applyTransforms(){this._isCaching||(v.rotate(this._rotation),v.scale(this._scaleX,this._scaleY))}get rotation(){return this._rotation}set rotation(t){this._rotation=t*Math.PI/180,this.markBoundsDirty()}get scaleX(){return this._scaleX}set scaleX(t){this._scaleX=t,this.markBoundsDirty()}get scaleY(){return this._scaleY}set scaleY(t){this._scaleY=t,this.markBoundsDirty()}calculateBounds(){const t=this.width/2,e=this.height/2,i=[{x:-t,y:-e},{x:t,y:-e},{x:t,y:e},{x:-t,y:e}],s=Math.cos(this._rotation),n=Math.sin(this._rotation),r=i.map(({x:d,y:m})=>{d*=this._scaleX,m*=this._scaleY;const g=d*s-m*n,p=d*n+m*s;return{x:g+this.x,y:p+this.y}}),o=r.map(d=>d.x),a=r.map(d=>d.y),l=Math.min(...o),c=Math.max(...o),u=Math.min(...a),h=Math.max(...a);return{x:(l+c)/2,y:(u+h)/2,width:c-l,height:h-u}}}class re extends ue{constructor(t={}){super(t),this._color=t.color??null,this._stroke=t.stroke??null,this._lineWidth=t.lineWidth??1,this._lineJoin=t.lineJoin??"miter",this._lineCap=t.lineCap??"butt",this._miterLimit=t.miterLimit??10,this.logger.log("Shape",this.x,this.y,this.width,this.height)}get color(){return this._color}set color(t){this._color=t,this.invalidateCache()}get stroke(){return this._stroke}set stroke(t){this._stroke=t,this.invalidateCache()}get lineWidth(){return this._lineWidth}set lineWidth(t){this._lineWidth=Math.max(0,t),this.invalidateCache()}get lineJoin(){return this._lineJoin}set lineJoin(t){this._lineJoin=t,this.invalidateCache()}get lineCap(){return this._lineCap}set lineCap(t){this._lineCap=t,this.invalidateCache()}get miterLimit(){return this._miterLimit}set miterLimit(t){this._miterLimit=t,this.invalidateCache()}}class fi extends ue{constructor(t={}){super(t),this._collection=new Te({sortByZIndex:t.sortByZIndex||!0}),this._collection._owner=this,this._childrenVersion=0,this._cachedBounds=null,t.width=Math.max(0,t.width||0),t.height=Math.max(0,t.height||0),this.userDefinedWidth=t.width,this.userDefinedHeight=t.height,this.userDefinedDimensions=t.width!==void 0&&t.height!==void 0&&(t.width>0||t.height>0)}add(t){if(t==null||t==null)throw new Error("Object is null or undefined");if(!(t instanceof ue))throw new TypeError("Group can only add Transformable instances");return t.parent=this,this._collection.add(t),this._childrenVersion++,this.markBoundsDirty(),this.invalidateCache(),t}remove(t){const e=this._collection.remove(t);return e&&(t.parent=null,this._childrenVersion++,this.markBoundsDirty(),this.invalidateCache()),e}clear(){this._collection.clear(),this._childrenVersion++,this.markBoundsDirty(),this.invalidateCache()}bringToFront(t){return this._collection.bringToFront(t)}sendToBack(t){return this._collection.sendToBack(t)}bringForward(t){return this._collection.bringForward(t)}sendBackward(t){return this._collection.sendBackward(t)}draw(){super.draw(),this.logger.log("Group.draw children:",this.children.length),this._renderChildren()}_renderChildren(){const t=this._collection.getSortedChildren();for(let e=0;e<t.length;e++){const i=t[e];i.visible&&(v.save(),i.render(),v.restore())}}update(t){this.logger.groupCollapsed("Group.update");const e=this._collection.getSortedChildren();for(let i=0;i<e.length;i++){const s=e[i];s.active&&typeof s.update=="function"&&s.update(t)}super.update(t),this.logger.groupEnd()}get children(){var t;return((t=this._collection)==null?void 0:t.children)||[]}get width(){return this.userDefinedDimensions?this._width:this.getBounds().width}set width(t){const e=Math.max(0,t);this._width=e,this.userDefinedWidth=e,this.userDefinedDimensions=(this.userDefinedWidth>0||this.userDefinedHeight>0)&&this.userDefinedWidth!==void 0&&this.userDefinedHeight!==void 0,this.markBoundsDirty()}get height(){return this.userDefinedDimensions?this._height:this.getBounds().height}set height(t){const e=Math.max(0,t);this._height=e,this.userDefinedHeight=e,this.userDefinedDimensions=(this.userDefinedWidth>0||this.userDefinedHeight>0)&&this.userDefinedWidth!==void 0&&this.userDefinedHeight!==void 0,this.markBoundsDirty()}calculateBounds(){var t;if(this.userDefinedDimensions)return{x:this.x,y:this.y,width:this._width,height:this._height};if(!((t=this.children)!=null&&t.length))return{x:this.x,y:this.y,width:0,height:0};let e=1/0,i=1/0,s=-1/0,n=-1/0;for(const a of this.children){const l=a.x,c=a.y,u=a.width,h=a.height,d=l-u/2,m=l+u/2,g=c-h/2,p=c+h/2;e=Math.min(e,d),s=Math.max(s,m),i=Math.min(i,g),n=Math.max(n,p)}const r=s-e,o=n-i;return{x:this.x,y:this.y,width:r,height:o}}getDebugBounds(){const t=this.calculateBounds();return{width:t.width,height:t.height,x:-t.width/2,y:-t.height/2}}forEachTransform(t){return this.children.forEach((e,i)=>{e.transform&&t(e.transform,e,i)}),this}translateChildren(t,e){return this.forEachTransform(i=>i.translateBy(t,e))}scaleChildren(t){return this.forEachTransform(e=>e.scaleBy(t))}rotateChildren(t){return this.forEachTransform(e=>e.rotateBy(t))}resetChildTransforms(){return this.forEachTransform(t=>t.reset())}}class di extends re{constructor(t={}){super(t)}draw(){super.draw(),this.drawRect()}drawRect(){const t=-this.width/2,e=-this.height/2;this.color&&v.shapes.rect(t,e,this.width,this.height,this.color),this.stroke&&v.shapes.outlineRect(t,e,this.width,this.height,this.stroke,this.lineWidth)}}class Ne{constructor(t,e){if(this.width=t,this.height=e,this.canvas=document.createElement("canvas"),this.canvas.width=t,this.canvas.height=e,this.gl=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!0,preserveDrawingBuffer:!0}),!this.gl){console.warn("WebGL not available, falling back to Canvas 2D"),this.available=!1;return}this.available=!0;const i=this.gl;i.enable(i.BLEND),i.blendFunc(i.ONE,i.ONE_MINUS_SRC_ALPHA),i.viewport(0,0,t,e),this.programs=new Map,this.currentProgram=null,this.uniformLocations=new Map,this._needsAttributeRebind=!1,this._createQuad()}isAvailable(){return this.available}resize(t,e){this.width=t,this.height=e,this.canvas.width=t,this.canvas.height=e,this.gl&&(this.gl.viewport(0,0,t,e),this._needsAttributeRebind=!0)}_createQuad(){const t=this.gl,e=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),i=new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]);this.positionBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW),this.uvBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.uvBuffer),t.bufferData(t.ARRAY_BUFFER,i,t.STATIC_DRAW)}_compileShader(t,e){const i=this.gl,s=i.createShader(t);return i.shaderSource(s,e),i.compileShader(s),i.getShaderParameter(s,i.COMPILE_STATUS)?s:(console.error("Shader compile error:",i.getShaderInfoLog(s)),console.error("Source:",e),i.deleteShader(s),null)}useProgram(t,e,i){if(!this.available)return null;const s=this.gl;if(this.programs.has(t)){const a=this.programs.get(t);return s.useProgram(a),this.currentProgram=t,this._needsAttributeRebind&&(this._bindAttributes(a),this._needsAttributeRebind=!1),a}const n=this._compileShader(s.VERTEX_SHADER,e),r=this._compileShader(s.FRAGMENT_SHADER,i);if(!n||!r)return null;const o=s.createProgram();return s.attachShader(o,n),s.attachShader(o,r),s.linkProgram(o),s.getProgramParameter(o,s.LINK_STATUS)?(this.programs.set(t,o),this.uniformLocations.set(t,new Map),s.useProgram(o),this.currentProgram=t,this._bindAttributes(o),o):(console.error("Program link error:",s.getProgramInfoLog(o)),s.deleteProgram(o),null)}_bindAttributes(t){const e=this.gl,i=e.getAttribLocation(t,"aPosition"),s=e.getAttribLocation(t,"aUv");i!==-1&&(e.bindBuffer(e.ARRAY_BUFFER,this.positionBuffer),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,0,0)),s!==-1&&(e.bindBuffer(e.ARRAY_BUFFER,this.uvBuffer),e.enableVertexAttribArray(s),e.vertexAttribPointer(s,2,e.FLOAT,!1,0,0))}_getUniformLocation(t){const e=this.gl,i=this.programs.get(this.currentProgram),s=this.uniformLocations.get(this.currentProgram);return s.has(t)||s.set(t,e.getUniformLocation(i,t)),s.get(t)}setUniforms(t){if(!this.available||!this.currentProgram)return;const e=this.gl;for(const[i,s]of Object.entries(t)){const n=this._getUniformLocation(i);if(n!==null)if(typeof s=="number")e.uniform1f(n,s);else if(Array.isArray(s))switch(s.length){case 2:e.uniform2fv(n,s);break;case 3:e.uniform3fv(n,s);break;case 4:e.uniform4fv(n,s);break}else s instanceof Float32Array&&(s.length===9?e.uniformMatrix3fv(n,!1,s):s.length===16&&e.uniformMatrix4fv(n,!1,s))}}setColorUniform(t,e){if(!this.available||!this.currentProgram)return;const i=e.replace("#",""),s=parseInt(i.substring(0,2),16)/255,n=parseInt(i.substring(2,4),16)/255,r=parseInt(i.substring(4,6),16)/255,o=this._getUniformLocation(t);o!==null&&this.gl.uniform3f(o,s,n,r)}clear(t=0,e=0,i=0,s=0){if(!this.available)return;const n=this.gl;n.clearColor(t,e,i,s),n.clear(n.COLOR_BUFFER_BIT)}render(){if(!this.available||!this.currentProgram)return;const t=this.gl;t.drawArrays(t.TRIANGLES,0,6)}compositeOnto(t,e,i,s,n){this.available&&t.drawImage(this.canvas,e,i,s??this.canvas.width,n??this.canvas.height)}getCanvas(){return this.canvas}destroy(){if(!this.available)return;const t=this.gl;for(const e of this.programs.values())t.deleteProgram(e);t.deleteBuffer(this.positionBuffer),t.deleteBuffer(this.uvBuffer),this.programs.clear(),this.uniformLocations.clear()}}const mi=`
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,me=`
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
`,gi=`
${me}

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
`,pi=`
${me}

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
`,vi=`
${me}

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
`,yi=`
${me}

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
`,Lt={vertex:mi,star:gi,blackHole:pi,rockyPlanet:vi,gasGiant:yi},We=class wt extends re{static _getGLRenderer(t,e){return wt._glRenderer?(wt._glRendererSize.width!==t||wt._glRendererSize.height!==e)&&(wt._glRenderer.resize(t,e),wt._glRendererSize={width:t,height:e}):(wt._glRenderer=new Ne(t,e),wt._glRendererSize={width:t,height:e}),wt._glRenderer}constructor(t,e={}){super(e),this.radius=t,this.camera=e.camera??null,this.debug=e.debug??!1,this.segments=e.segments??20,this.useShader=e.useShader??!1,this.shaderType=e.shaderType??"star",this.shaderUniforms=e.shaderUniforms??{},this._shaderInitialized=!1,this.selfRotationX=e.selfRotationX??0,this.selfRotationY=e.selfRotationY??0,this.selfRotationZ=e.selfRotationZ??0,this._generateGeometry()}setCamera(t){return this.camera=t,this}setShaderUniforms(t){return Object.assign(this.shaderUniforms,t),this}_getFragmentShader(){switch(this.shaderType){case"star":return Lt.star;case"blackHole":return Lt.blackHole;case"rockyPlanet":return Lt.rockyPlanet;case"gasGiant":return Lt.gasGiant;default:return Lt.star}}_initShader(t,e){const i=wt._getGLRenderer(t,e);if(!i||!i.isAvailable()){this.useShader=!1;return}const s=`sphere_${this.shaderType}`;i.useProgram(s,Lt.vertex,this._getFragmentShader()),this._shaderInitialized=!0}_renderWithShader(t,e,i,s){var n,r,o,a;const c=1+(((n=this.shaderUniforms)==null?void 0:n.uTidalStretch)??0),u=s*c,h=Math.ceil((s+u)*2),d=wt._getGLRenderer(h,h);if(!d||!d.isAvailable())return!1;this._shaderInitialized||this._initShader(h,h);const m=`sphere_${this.shaderType}`;d.useProgram(m,Lt.vertex,this._getFragmentShader()),d.clear(0,0,0,0);const p=1.25*s/(h/2);d.setUniforms({uTime:performance.now()/1e3,uResolution:[h,h],uBaseRadius:p,uCameraRotation:[((r=this.camera)==null?void 0:r.rotationX)??0,((o=this.camera)==null?void 0:o.rotationY)??0,((a=this.camera)==null?void 0:a.rotationZ)??0]}),d.setUniforms(this.shaderUniforms);for(const[w,x]of Object.entries(this.shaderUniforms))typeof x=="string"&&x.startsWith("#")&&d.setColorUniform(w,x);d.render();const b=e-h/2,y=i-h/2;return d.compositeOnto(t,b,y,h,h),!0}_generateGeometry(){this.vertices=[],this.faces=[];const t=this.segments,e=this.segments*2;for(let i=0;i<=t;i++){const s=i*Math.PI/t,n=Math.sin(s),r=Math.cos(s);for(let o=0;o<=e;o++){const a=o*2*Math.PI/e,l=Math.sin(a),c=Math.cos(a),u=this.radius*n*c,h=this.radius*r,d=this.radius*n*l;this.vertices.push({x:u,y:h,z:d,nx:n*c,ny:r,nz:n*l})}}for(let i=0;i<t;i++)for(let s=0;s<e;s++){const n=i*(e+1)+s,r=n+e+1;this.faces.push([n,r,n+1]),this.faces.push([r,r+1,n+1])}}_applySelfRotation(t,e,i){if(this.selfRotationY!==0){const s=Math.cos(this.selfRotationY),n=Math.sin(this.selfRotationY),r=t*s-i*n,o=t*n+i*s;t=r,i=o}if(this.selfRotationX!==0){const s=Math.cos(this.selfRotationX),n=Math.sin(this.selfRotationX),r=e*s-i*n,o=e*n+i*s;e=r,i=o}if(this.selfRotationZ!==0){const s=Math.cos(this.selfRotationZ),n=Math.sin(this.selfRotationZ),r=t*s-e*n,o=t*n+e*s;t=r,e=o}return{x:t,y:e,z:i}}_calculateLighting(t,e,i){const o=Math.sqrt(.99),a=.5/o,l=.7/o,c=.5/o;let u=t*a+e*l+i*c;return u=Math.max(0,u)*.7+.3,u}_applyLighting(t,e){if(!t||typeof t!="string"||!t.startsWith("#"))return t;const i=t.replace("#",""),s=parseInt(i.substring(0,2),16),n=parseInt(i.substring(2,4),16),r=parseInt(i.substring(4,6),16),o=Math.round(s*e),a=Math.round(n*e),l=Math.round(r*e);return`rgb(${o}, ${a}, ${l})`}draw(){if(super.draw(),!this.camera){this.color&&v.shapes.fillCircle(0,0,this.radius,this.color),this.debug&&this.stroke&&v.shapes.strokeCircle(0,0,this.radius,this.stroke,this.lineWidth);return}if(this.useShader&&!this.debug){const s=this.camera.project(this.x||0,this.y||0,this.z||0),n=this.camera.perspective/(this.camera.perspective+s.z),r=this.radius*n,o=v.ctx,a=o.getTransform(),l=a.e,c=a.f;o.save(),o.setTransform(1,0,0,1,0,0);const u=this._renderWithShader(o,l+s.x,c+s.y,r);if(o.restore(),u)return}const t=this.selfRotationX!==0||this.selfRotationY!==0||this.selfRotationZ!==0,e=this.vertices.map(s=>{let n=s.x,r=s.y,o=s.z,a=s.nx,l=s.ny,c=s.nz;if(t){const x=this._applySelfRotation(n,r,o);n=x.x,r=x.y,o=x.z;const S=this._applySelfRotation(a,l,c);a=S.x,l=S.y,c=S.z}const u=this.camera.project(n+(this.x||0),r+(this.y||0),o+(this.z||0));if(this.camera.rotationZ!==0){const x=Math.cos(this.camera.rotationZ),S=Math.sin(this.camera.rotationZ),C=a,R=l;a=C*x-R*S,l=C*S+R*x}const h=Math.cos(this.camera.rotationY),d=Math.sin(this.camera.rotationY),m=a*h-c*d,g=a*d+c*h,p=Math.cos(this.camera.rotationX),b=Math.sin(this.camera.rotationX),y=l*p-g*b,w=l*b+g*p;return{...u,nx:m,ny:y,nz:w}});this.debug&&this.trace("Sphere3D.draw: projected vertices",e.length);const i=[];for(const s of this.faces){const n=e[s[0]],r=e[s[1]],o=e[s[2]];if(n.z<-this.camera.perspective+10||r.z<-this.camera.perspective+10||o.z<-this.camera.perspective+10)continue;const a=(n.z+r.z+o.z)/3,l=(n.nx+r.nx+o.nx)/3,c=(n.ny+r.ny+o.ny)/3,u=(n.nz+r.nz+o.nz)/3;if(u>.1)continue;const h=this._calculateLighting(l,c,u);i.push({vertices:[n,r,o],avgZ:a,intensity:h})}i.sort((s,n)=>n.avgZ-s.avgZ);for(const s of i){const n=s.vertices.map(r=>({x:r.x,y:r.y}));if(this.debug)v.ctx.beginPath(),v.ctx.moveTo(n[0].x,n[0].y),v.ctx.lineTo(n[1].x,n[1].y),v.ctx.lineTo(n[2].x,n[2].y),v.ctx.closePath(),this.stroke&&(v.ctx.strokeStyle=this.stroke,v.ctx.lineWidth=this.lineWidth??1,v.ctx.stroke());else if(this.color){const r=this._applyLighting(this.color,s.intensity);v.ctx.beginPath(),v.ctx.moveTo(n[0].x,n[0].y),v.ctx.lineTo(n[1].x,n[1].y),v.ctx.lineTo(n[2].x,n[2].y),v.ctx.closePath(),v.ctx.fillStyle=r,v.ctx.fill()}}}calculateBounds(){const t=this.radius*2;return{x:this.x,y:this.y,width:t,height:t}}};E(We,"_glRenderer",null);E(We,"_glRendererSize",{width:0,height:0});const _i=`
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,ge=`
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
`,bi=`
${ge}

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
`,xi=`
${ge}

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
`,wi=`
${ge}

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
`,Mi=`
${ge}

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
`,Ft={vertex:_i,gradient:bi,grid:xi,checkerboard:wi,noise:Mi},Ge=class Mt extends re{static _getGLRenderer(t,e){return Mt._glRenderer?(Mt._glRendererSize.width!==t||Mt._glRendererSize.height!==e)&&(Mt._glRenderer.resize(t,e),Mt._glRendererSize={width:t,height:e}):(Mt._glRenderer=new Ne(t,e),Mt._glRendererSize={width:t,height:e}),Mt._glRenderer}constructor(t,e,i={}){super(i),this.planeWidth=t,this.planeHeight=e,this.x=i.x??0,this.y=i.y??0,this.z=i.z??0,this.camera=i.camera??null,this.debug=i.debug??!1,this.doubleSided=i.doubleSided??!0,this.texture=i.texture??null,this.selfRotationX=i.selfRotationX??0,this.selfRotationY=i.selfRotationY??0,this.selfRotationZ=i.selfRotationZ??0,this.useShader=i.useShader??!1,this.shaderType=i.shaderType??"gradient",this.shaderUniforms=i.shaderUniforms??{},this._shaderInitialized=!1,this._generateGeometry()}setCamera(t){return this.camera=t,this}setTexture(t){return this.texture=t,this}setShaderUniforms(t){return Object.assign(this.shaderUniforms,t),this}_generateGeometry(){const t=this.planeWidth/2,e=this.planeHeight/2;this.vertices=[{x:-t,y:-e,z:0,nx:0,ny:0,nz:-1,u:0,v:0},{x:t,y:-e,z:0,nx:0,ny:0,nz:-1,u:1,v:0},{x:t,y:e,z:0,nx:0,ny:0,nz:-1,u:1,v:1},{x:-t,y:e,z:0,nx:0,ny:0,nz:-1,u:0,v:1}],this.faces=[[0,1,2],[0,2,3]]}_getFragmentShader(){switch(this.shaderType){case"gradient":return Ft.gradient;case"grid":return Ft.grid;case"checkerboard":return Ft.checkerboard;case"noise":return Ft.noise;default:return Ft.gradient}}_initShader(t,e){const i=Mt._getGLRenderer(t,e);if(!i||!i.isAvailable())return!1;const s=`plane_${this.shaderType}`,n=Ft.vertex,r=this._getFragmentShader();try{return i.useProgram(s,n,r),this._shaderInitialized=!0,!0}catch(o){return console.warn("Plane3D shader init failed:",o),!1}}_renderWithShader(t,e,i,s,n){const r=Math.max(Math.ceil(Math.max(s,n)),16);if(!this._shaderInitialized&&!this._initShader(r,r))return!1;const o=Mt._getGLRenderer(r,r);if(!o||!o.isAvailable())return!1;const a=`plane_${this.shaderType}`;o.useProgram(a,Ft.vertex,this._getFragmentShader());const l=performance.now()/1e3;o.setUniforms({uTime:l,uResolution:[r,r]}),o.setUniforms(this.shaderUniforms),o.render();const c=e-s/2,u=i-n/2;return o.compositeOnto(t,c,u,s,n),!0}_applySelfRotation(t,e,i){if(this.selfRotationY!==0){const s=Math.cos(this.selfRotationY),n=Math.sin(this.selfRotationY),r=t*s-i*n,o=t*n+i*s;t=r,i=o}if(this.selfRotationX!==0){const s=Math.cos(this.selfRotationX),n=Math.sin(this.selfRotationX),r=e*s-i*n,o=e*n+i*s;e=r,i=o}if(this.selfRotationZ!==0){const s=Math.cos(this.selfRotationZ),n=Math.sin(this.selfRotationZ),r=t*s-e*n,o=t*n+e*s;t=r,e=o}return{x:t,y:e,z:i}}_calculateLighting(t,e,i){const o=Math.sqrt(.99),a=.5/o,l=.7/o,c=.5/o;let u=t*a+e*l+i*c;return u=Math.max(0,u)*.7+.3,u}_applyLighting(t,e){if(!t||typeof t!="string"||!t.startsWith("#"))return t;const i=t.replace("#",""),s=parseInt(i.substring(0,2),16),n=parseInt(i.substring(2,4),16),r=parseInt(i.substring(4,6),16),o=Math.round(s*e),a=Math.round(n*e),l=Math.round(r*e);return`rgb(${o}, ${a}, ${l})`}draw(){if(super.draw(),!this.camera){this.color&&v.shapes.fillRect(-this.planeWidth/2,-this.planeHeight/2,this.planeWidth,this.planeHeight,this.color);return}const t=this.selfRotationX!==0||this.selfRotationY!==0||this.selfRotationZ!==0,e=this.vertices.map(h=>{let d=h.x,m=h.y,g=h.z,p=h.nx,b=h.ny,y=h.nz;if(t){const P=this._applySelfRotation(d,m,g);d=P.x,m=P.y,g=P.z;const D=this._applySelfRotation(p,b,y);p=D.x,b=D.y,y=D.z}const w=this.camera.project(d+this.x,m+this.y,g+this.z);if(this.camera.rotationZ!==0){const P=Math.cos(this.camera.rotationZ),D=Math.sin(this.camera.rotationZ),I=p,X=b;p=I*P-X*D,b=I*D+X*P}const x=Math.cos(this.camera.rotationY),S=Math.sin(this.camera.rotationY),C=p*x-y*S,R=p*S+y*x,M=Math.cos(this.camera.rotationX),T=Math.sin(this.camera.rotationX),A=b*M-R*T,k=b*T+R*M;return{...w,nx:C,ny:A,nz:k,u:h.u,v:h.v}}),i=(e[0].nz+e[1].nz+e[2].nz+e[3].nz)/4;if(!this.doubleSided&&i>.1||((e[0].z+e[1].z+e[2].z+e[3].z)/4,e.some(h=>h.z<-this.camera.perspective+10)))return;if(this.useShader&&!this.debug){const h=e.map(k=>k.x),d=e.map(k=>k.y),m=Math.min(...h),g=Math.max(...h),p=Math.min(...d),b=Math.max(...d),y=g-m,w=b-p,x=(m+g)/2,S=(p+b)/2,C=v.ctx,R=C.getTransform(),M=R.e,T=R.f;C.save(),C.setTransform(1,0,0,1,0,0);const A=this._renderWithShader(C,M+x,T+S,y,w);if(C.restore(),A)return}const n=v.ctx;let r=(e[0].nx+e[1].nx+e[2].nx+e[3].nx)/4,o=(e[0].ny+e[1].ny+e[2].ny+e[3].ny)/4,a=r,l=o,c=i;this.doubleSided&&i>0&&(a=-r,l=-o,c=-i);const u=this._calculateLighting(a,l,c);for(const h of this.faces){const d=e[h[0]],m=e[h[1]],g=e[h[2]];if(this.debug)n.beginPath(),n.moveTo(d.x,d.y),n.lineTo(m.x,m.y),n.lineTo(g.x,g.y),n.closePath(),this.stroke&&(n.strokeStyle=this.stroke,n.lineWidth=this.lineWidth??1,n.stroke());else if(this.texture)this._renderTexturedTriangle(n,d,m,g);else if(this.color){const p=this._applyLighting(this.color,u);n.beginPath(),n.moveTo(d.x,d.y),n.lineTo(m.x,m.y),n.lineTo(g.x,g.y),n.closePath(),n.fillStyle=p,n.fill()}}}_renderTexturedTriangle(t,e,i,s){if(!this.texture||!this.texture.complete)return;const n=this.texture,r=n.width,o=n.height,a=e.u*r,l=e.v*o,c=i.u*r,u=i.v*o,h=s.u*r,d=s.v*o,m=e.x,g=e.y,p=i.x,b=i.y,y=s.x,w=s.y,x=(c-a)*(d-l)-(h-a)*(u-l);if(Math.abs(x)<1e-4)return;const S=((p-m)*(d-l)-(y-m)*(u-l))/x,C=((y-m)*(c-a)-(p-m)*(h-a))/x,R=m-S*a-C*l,M=((b-g)*(d-l)-(w-g)*(u-l))/x,T=((w-g)*(c-a)-(b-g)*(h-a))/x,A=g-M*a-T*l;t.save(),t.beginPath(),t.moveTo(m,g),t.lineTo(p,b),t.lineTo(y,w),t.closePath(),t.clip(),t.setTransform(S,M,C,T,R,A),t.drawImage(n,0,0),t.restore()}getCenter(){return{x:this.x,y:this.y,z:this.z}}getBounds(){return{x:this.x-this.planeWidth/2,y:this.y-this.planeHeight/2,width:this.planeWidth,height:this.planeHeight}}};E(Ge,"_glRenderer",null);E(Ge,"_glRendererSize",{width:0,height:0});class Si extends re{constructor(t,e={}){super(e),this._text=t,this._font=e.font||"12px monospace",this._color=e.color||"yellow",this._align=e.align||"center",this._baseline=e.baseline||"middle",this._calculateBounds(),this._calculateAlignmentOffsets()}draw(){super.draw(),this.logger.log("draw",this.font,this.color,this.opacity),v.text.setFont(this.font),v.text.setTextAlign(this.align),v.text.setTextBaseline(this.baseline),v.text.fillText(this.text,0,0,this.color)}_calculateAlignmentOffsets(){if(!v.text)return;const t=v.text.measureTextDimensions(this.text,this.font);switch(this._align){case"left":this._centerOffsetX=t.width/2;break;case"center":this._centerOffsetX=0;break;case"right":this._centerOffsetX=-t.width/2-5;break}switch(this._baseline){case"top":this._centerOffsetY=t.height/4;break;case"middle":this._centerOffsetY=-2;break;case"bottom":this._centerOffsetY=-t.height;break}}getTextBounds(){if(v.text){const t=v.text.measureTextDimensions(this.text,this.font),e=2;return{x:this._centerOffsetX-t.width/2,y:this._centerOffsetY-t.height/2,width:t.width+e*2,height:t.height+e*2}}return{x:this._centerOffsetX,y:this._centerOffsetY,width:this._width,height:this._height}}_calculateBounds(){if(v.text){const t=v.text.measureTextDimensions(this.text,this.font);this._width=t.width,this._height=t.height,this._calculateAlignmentOffsets()}else this._width=this.text?this.text.length*8:0,this._height=16;this.trace("TextShape.calculateBounds: "+this._width+"x"+this._height)}getDebugBounds(){const t=this.getTextBounds();return{x:t.x,y:t.y,width:t.width,height:t.height}}checkDirty(t,e){t!==e&&(this._boundsDirty=!0,this._calculateBounds())}get text(){return this._text}set text(t){this.checkDirty(t,this._text),this._text=t}get font(){return this._font}set font(t){this.checkDirty(t,this._font),this._font=t}get color(){return this._color}set color(t){this._color=t}get align(){return this._align}set align(t){this.checkDirty(t,this._align),this._align=t}get baseline(){return this._baseline}set baseline(t){this.checkDirty(t,this._baseline),this._baseline=t}}class be extends re{constructor(t,e={}){if(!t&&!e.width&&!e.height)throw new Error("ImageShape must be initialized with either a bitmap or width and height");super(e),this._bitmap=t??v.img.createImageData(e.width,e.height),this._width=e.width??(t==null?void 0:t.width)??0,this._height=e.height??(t==null?void 0:t.height)??0,this.anchor=e.anchor??"center",this._anchorX=.5,this._anchorY=.5,this._updateAnchorOffsets(),this.smoothing=e.smoothing!==!1,t instanceof ImageData&&this.buffer(t)}_updateAnchorOffsets(){var t;const e=((t=this.anchor)==null?void 0:t.toLowerCase())??"center";e.includes("left")?this._anchorX=0:e.includes("right")?this._anchorX=1:this._anchorX=.5,e.includes("top")?this._anchorY=0:e.includes("bottom")?this._anchorY=1:this._anchorY=.5}get bitmap(){return this._bitmap}set bitmap(t){t&&(this._bitmap=t,!this._width&&t.width&&(this._width=t.width),!this._height&&t.height&&(this._height=t.height),t instanceof ImageData&&this.buffer(t))}buffer(t){if(!t)return;this._buffer||(this._buffer=document.createElement("canvas")),(this._buffer.width!==t.width||this._buffer.height!==t.height)&&(this._buffer.width=t.width,this._buffer.height=t.height),this._buffer.getContext("2d").putImageData(t,0,0)}reset(){this._buffer=null,this._bitmap=v.img.createImageData(this.width,this.height)}setAnchor(t){this.anchor=t,this._updateAnchorOffsets()}draw(){if(!this.visible||!this._bitmap&&!this._buffer)return;super.draw();let t=this._bitmap instanceof ImageData?this._buffer:this._bitmap;(!t||this._bitmap instanceof ImageData&&!this._buffer)&&(this._bitmap instanceof ImageData&&(this.buffer(this._bitmap),t=this._buffer),!t)||v.img.draw(t,0,0,{width:this.width,height:this.height,anchor:this.anchor,rotation:this.rotation,scaleX:this.scaleX,scaleY:this.scaleY,alpha:this.opacity,smoothing:this.smoothing,flipX:this.scaleX<0,flipY:this.scaleY<0})}calculateBounds(){return{x:-this._anchorX*this.width,y:-this._anchorY*this.height,width:this.width,height:this.height}}}class Ue{constructor(){this.listeners={}}on(t,e){this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)}off(t,e){this.listeners[t]&&(this.listeners[t]=this.listeners[t].filter(i=>i!==e))}emit(t,e){this.listeners[t]&&this.listeners[t].forEach(i=>i(e))}}class F{static init(t){F.game=t,F.x=0,F.y=0,F.down=!1,t.events.on("mousedown",e=>F._onDown(e,t)),t.events.on("mouseup",e=>F._onUp(e,t)),t.events.on("mousemove",e=>F._onMove(e,t)),t.events.on("touchstart",e=>F._onTouchStart(e,t)),t.events.on("touchend",e=>F._onTouchEnd(e,t)),t.events.on("touchmove",e=>F._onTouchMove(e,t))}static _scaleToCanvas(t,e,i){const s=t.canvas,n=s.getBoundingClientRect(),r=s.width/n.width,o=s.height/n.height;return{x:e*r,y:i*o}}static _setPosition(t,e){F.x=t,F.y=e}static _onDown(t,e){F.down=!0;const i=F._scaleToCanvas(e,t.offsetX,t.offsetY);F._setPosition(i.x,i.y),Object.defineProperty(t,"x",{value:i.x,configurable:!0}),Object.defineProperty(t,"y",{value:i.y,configurable:!0}),e.events.emit("inputdown",t)}static _onUp(t,e){F.down=!1;const i=F._scaleToCanvas(e,t.offsetX,t.offsetY);F._setPosition(i.x,i.y),Object.defineProperty(t,"x",{value:i.x,configurable:!0}),Object.defineProperty(t,"y",{value:i.y,configurable:!0}),e.events.emit("inputup",t)}static _onMove(t,e){const i=F._scaleToCanvas(e,t.offsetX,t.offsetY);F._setPosition(i.x,i.y),Object.defineProperty(t,"x",{value:i.x,configurable:!0}),Object.defineProperty(t,"y",{value:i.y,configurable:!0}),e.events.emit("inputmove",t)}static _onTouchStart(t,e){const i=t.touches[0],s=e.canvas.getBoundingClientRect();F.down=!0;const n=i.clientX-s.left,r=i.clientY-s.top,o=F._scaleToCanvas(e,n,r);F._setPosition(o.x,o.y),Object.defineProperty(t,"x",{value:o.x,configurable:!0}),Object.defineProperty(t,"y",{value:o.y,configurable:!0}),e.events.emit("inputdown",t)}static _onTouchEnd(t,e){F.down=!1,e.events.emit("inputup",t)}static _onTouchMove(t,e){const i=t.touches[0],s=e.canvas.getBoundingClientRect(),n=i.clientX-s.left,r=i.clientY-s.top,o=F._scaleToCanvas(e,n,r);F._setPosition(o.x,o.y),Object.defineProperty(t,"x",{value:o.x,configurable:!0}),Object.defineProperty(t,"y",{value:o.y,configurable:!0}),e.events.emit("inputmove",t)}}const U=class et{static init(t){et._gameMap.set(t.canvas,t),et.game=t,et.canvas=t.canvas,et.x=0,et.y=0,et.leftDown=!1,et.middleDown=!1,et.rightDown=!1,t.canvas.addEventListener("mousemove",et._onMove),t.canvas.addEventListener("mousedown",et._onDown),t.canvas.addEventListener("mouseup",et._onUp),t.canvas.addEventListener("click",et._onClick),t.canvas.addEventListener("wheel",et._onWheel)}static _getGameForEvent(t){const e=t.currentTarget;return et._gameMap.get(e)||et.game}static _updatePosition(t,e){const i=e.canvas,s=i.getBoundingClientRect(),n=t.clientX-s.left,r=t.clientY-s.top,o=i.width/s.width,a=i.height/s.height;et.x=n*o,et.y=r*a}};E(U,"_gameMap",new Map);E(U,"_onMove",f=>{const t=U._getGameForEvent(f);U._updatePosition(f,t),t.events.emit("mousemove",f)});E(U,"_onDown",f=>{const t=U._getGameForEvent(f);U._updatePosition(f,t),f.button===0&&(U.leftDown=!0),f.button===1&&(U.middleDown=!0),f.button===2&&(U.rightDown=!0),t.events.emit("mousedown",f)});E(U,"_onUp",f=>{const t=U._getGameForEvent(f);U._updatePosition(f,t),f.button===0&&(U.leftDown=!1),f.button===1&&(U.middleDown=!1),f.button===2&&(U.rightDown=!1),t.events.emit("mouseup",f)});E(U,"_onClick",f=>{const t=U._getGameForEvent(f);U._updatePosition(f,t),f.canvasX=U.x,f.canvasY=U.y,Object.defineProperty(f,"x",{value:U.x,writable:!1}),Object.defineProperty(f,"y",{value:U.y,writable:!1}),t.events.emit("click",f)});E(U,"_onWheel",f=>{const t=U._getGameForEvent(f);U._updatePosition(f,t),t.events.emit("wheel",f)});let Ci=U;const B=class nt{static init(t){nt.game=t,window.addEventListener("keydown",nt._onKeyDown),window.addEventListener("keyup",nt._onKeyUp)}static isDown(t){return nt._down.has(t)}static _onKeyDown(t){const e=nt._codeMap[t.code];e&&(nt._down.has(e)||(nt._down.add(e),nt.game.events.emit(e,t))),nt.game.events.emit(t.type,t)}static _onKeyUp(t){const e=nt._codeMap[t.code];e&&nt._down.has(e)&&(nt._down.delete(e),nt.game.events.emit(e+"_up",t)),nt.game.events.emit(t.type,t)}};E(B,"W","W");E(B,"A","A");E(B,"S","S");E(B,"D","D");E(B,"Q","Q");E(B,"E","E");E(B,"R","R");E(B,"F","F");E(B,"Z","Z");E(B,"C","C");E(B,"UP","UP");E(B,"DOWN","DOWN");E(B,"LEFT","LEFT");E(B,"RIGHT","RIGHT");E(B,"SPACE","SPACE");E(B,"SHIFT","SHIFT");E(B,"ENTER","ENTER");E(B,"ESC","ESC");E(B,"_codeMap",{KeyW:B.W,KeyA:B.A,KeyS:B.S,KeyD:B.D,KeyQ:B.Q,KeyE:B.E,KeyR:B.R,KeyF:B.F,KeyZ:B.Z,KeyC:B.C,ArrowUp:B.UP,ArrowDown:B.DOWN,ArrowLeft:B.LEFT,ArrowRight:B.RIGHT,Space:B.SPACE,ShiftLeft:B.SHIFT,ShiftRight:B.SHIFT,Enter:B.ENTER,NumpadEnter:B.ENTER,Escape:B.ESC});E(B,"_down",new Set);E(B,"game",null);let Ti=B;const vt=class lt{static init(t){lt._gameMap.set(t.canvas,t),lt.game=t,lt.canvas=t.canvas,lt.x=0,lt.y=0,lt.active=!1,t.canvas.addEventListener("touchstart",lt._onStart),t.canvas.addEventListener("touchend",lt._onEnd),t.canvas.addEventListener("touchmove",lt._onMove)}static _getGameForEvent(t){const e=t.currentTarget;return lt._gameMap.get(e)||lt.game}static _updatePosition(t,e){const i=e.canvas,s=i.getBoundingClientRect(),n=t.clientX-s.left,r=t.clientY-s.top,o=i.width/s.width,a=i.height/s.height;lt.x=n*o,lt.y=r*a}};E(vt,"_gameMap",new Map);E(vt,"_onStart",f=>{if(f.touches.length>0){const t=vt._getGameForEvent(f);vt.active=!0,vt._updatePosition(f.touches[0],t),t.events.emit("touchstart",f)}});E(vt,"_onEnd",f=>{const t=vt._getGameForEvent(f);vt.active=!1,t.events.emit("touchend",f)});E(vt,"_onMove",f=>{if(f.touches.length>0){const t=vt._getGameForEvent(f);vt._updatePosition(f.touches[0],t),t.events.emit("touchmove",f)}});let Ri=vt;function Ai(f,t={}){var e;if(!f||!(f instanceof Vt))return console.warn("applyAnchor can only be applied to GameObject instances"),f;f._anchor={position:t.anchor??null,margin:t.anchorMargin??10,offsetX:t.anchorOffsetX??0,offsetY:t.anchorOffsetY??0,relative:t.anchorRelative??!1,setTextAlign:t.anchorSetTextAlign!==!1,lastUpdate:0};const i=(e=f.update)==null?void 0:e.bind(f);f.update=function(n){const r=f._anchor.relative===!0&&f.parent?f.parent:f._anchor.relative;if(f._anchor.position&&(f.boundsDirty||r&&r.boundsDirty||f.parent&&f.parent.boundsDirty)){let o;if(r){const c={x:r.x,y:r.y,width:r.width,height:r.height};o=De.calculate(f._anchor.position,f,c,f._anchor.margin,f._anchor.offsetX,f._anchor.offsetY)}else o=De.calculateAbsolute(f._anchor.position,f,f.game,f._anchor.margin,f._anchor.offsetX,f._anchor.offsetY);let a,l;f.parent&&!s(f)?r===f.parent?(a=o.x-r.x,l=o.y-r.y):(a=o.x-f.parent.x,l=o.y-f.parent.y):(a=o.x,l=o.y),f.transform&&typeof f.transform.position=="function"?f.transform.position(a,l):(f.x=a,f.y=l),f._anchor.setTextAlign&&("align"in f&&(f.align=o.align),"baseline"in f&&(f.baseline=o.baseline)),f._anchor.lastUpdate=f.game?f.game.lastTime:Date.now()}i&&i(n)};function s(n){return n.game&&n.game.pipeline&&n.game.pipeline.gameObjects&&n.game.pipeline.gameObjects.includes(n)}return f}class Vt extends ue{constructor(t,e={}){super(e),this.game=t,this.parent=null,this.events=new Ue,this._interactive=e.interactive??!1,this._hovered=!1,e.anchor&&Ai(this,e)}update(t){this.logger.groupCollapsed("GameObject.update: "+(this.name==null?this.constructor.name:this.name)),super.update(t),this.logger.groupEnd()}get interactive(){return this._interactive}set interactive(t){const e=!!t;this._interactive!==e&&(this._interactive=e,e===!0?this._enableEvents():(this._disableEvents(),this._hovered&&(this._hovered=!1,this.events.emit("mouseout"))))}_enableEvents(){this.logger.log(`${this.constructor.name} is now interactive`)}_disableEvents(){this.logger.log(`${this.constructor.name} is no longer interactive`)}get hovered(){return this._hovered}set hovered(t){this._hovered=!!t}_setHovered(t){this._hovered=!!t}_hitTest(t,e){var i;if(!this._interactive)return!1;const s=(i=this.getBounds)==null?void 0:i.call(this);if(!s)return!1;let n=t,r=e;const o=[];let a=this;for(;a;)o.unshift(a),a=a.parent;for(const u of o){if(n-=u.x||0,r-=u.y||0,u.rotation){const h=Math.cos(-u.rotation),d=Math.sin(-u.rotation),m=n;n=m*h-r*d,r=m*d+r*h}u.scaleX!==void 0&&u.scaleX!==0&&(n/=u.scaleX),u.scaleY!==void 0&&u.scaleY!==0&&(r/=u.scaleY)}const l=(s.width||this.width||0)/2,c=(s.height||this.height||0)/2;return n>=-l&&n<=l&&r>=-c&&r<=c}on(t,e){this.events.on(t,e)}off(t,e){this.events.off(t,e)}emit(t,...e){this.events.emit(t,...e)}}class Di extends Vt{constructor(t,e,i={}){if(super(t,i),!e||e==null||e==null)throw new Error("GameObjectShapeWrapper requires a shape");this.shape=e,i.color!==void 0&&(e.color=i.color),i.stroke!==void 0&&(e.stroke=i.stroke),i.lineWidth!==void 0&&(e.lineWidth=i.lineWidth),i.lineJoin!==void 0&&(e.lineJoin=i.lineJoin),i.lineCap!==void 0&&(e.lineCap=i.lineCap),i.miterLimit!==void 0&&(e.miterLimit=i.miterLimit),this.syncPropertiesToShape(),this.logger.log(`Created GameObject(${this.constructor.name}):`,{x:this.x,y:this.y,width:this.width,height:this.height,color:this.color,stroke:this.stroke})}syncPropertiesToShape(){if(!this.shape)return;const t=["width","height","rotation","scaleX","scaleY","visible","debug","debugColor"];for(const e of t)e in this&&e in this.shape&&this[e]!==this.shape[e]&&(this.shape[e]=this[e])}get color(){return this.shape?this.shape.color:null}set color(t){this.shape&&(this.shape.color=t)}get stroke(){return this.shape?this.shape.stroke:null}set stroke(t){this.shape&&(this.shape.stroke=t)}get lineWidth(){return this.shape?this.shape.lineWidth:1}set lineWidth(t){this.shape&&(this.shape.lineWidth=t)}get lineJoin(){return this.shape?this.shape.lineJoin:"miter"}set lineJoin(t){this.shape&&(this.shape.lineJoin=t)}get lineCap(){return this.shape?this.shape.lineCap:"butt"}set lineCap(t){this.shape&&(this.shape.lineCap=t)}get miterLimit(){return this.shape?this.shape.miterLimit:10}set miterLimit(t){this.shape&&(this.shape.miterLimit=t)}update(t){var e;this.active&&((e=this.onUpdate)==null||e.call(this,t),(this._boundsDirty||this.tweening)&&(this.syncPropertiesToShape(),this._boundsDirty=!1),super.update(t))}draw(){super.draw(),this.shape.render()}}class ae extends Vt{constructor(t,e={}){super(t,e),this._collection=new Te({sortByZIndex:e.sortByZIndex||!0}),this._collection._owner=this,this._width=e.width??0,this._height=e.height??0,this.forceWidth=null,this.forceHeight=null,this._naturalWidth=null,this._naturalHeight=null,this.userDefinedDimensions=!1,e.width!=null&&e.height!=null&&(this.userDefinedWidth=e.width,this.userDefinedHeight=e.height,this.userDefinedDimensions=!0)}update(t){this.logger.groupCollapsed("Scene.update: "+(this.name==null?this.constructor.name:this.name));for(let e=0;e<this.children.length;e++){const i=this.children[e];i.active&&i.update&&i.update(t)}super.update(t),this.logger.groupEnd()}add(t){if(t==null||t==null)throw new Error("GameObject is null or undefined");return t.parent!=null&&console.warn("This GameObject already has a parent. Consider removing it first."),t.parent=this,this._collection.add(t),this.markBoundsDirty(),t.init&&t.init(),t}markBoundsDirty(){super.markBoundsDirty(),this.children.forEach(t=>{t.markBoundsDirty()})}remove(t){const e=this._collection.remove(t);return e&&(t.parent=null,this.markBoundsDirty()),e}draw(){super.draw(),this.logger.log("Scene.draw chilren:"),this._collection.getSortedChildren().filter(t=>t.visible).map(function(t){return v.save(),t.render(),v.restore(),t})}getDebugBounds(){return{width:this.width,height:this.height,x:-this.width/2,y:-this.height/2}}getBounds(){return{x:this.x,y:this.y,width:this._width||0,height:this._height||0}}bringToFront(t){return this._collection.bringToFront(t)}sendToBack(t){return this._collection.sendToBack(t)}bringForward(t){return this._collection.bringForward(t)}sendBackward(t){return this._collection.sendBackward(t)}clear(){return this._collection.children.forEach(t=>this.remove(t)),this._collection.clear()}get children(){return this._collection.children}}class ki extends Vt{constructor(t,e={}){super(t,e),this._frames=[],this._currentFrame=0,this._frameAccumulator=0,this._isPlaying=e.autoPlay||!1,this._loop=e.loop!==void 0?e.loop:!0,this._frameRate=e.frameRate||12,this._frameDuration=1/this._frameRate,this._animations=new Map,this._currentAnimation=null,e.frames&&Array.isArray(e.frames)&&e.frames.forEach(i=>this.addFrame(i))}addAnimation(t,e,i={}){if(!t||typeof t!="string")throw new Error("Sprite.addAnimation: name is required");if(!e||!Array.isArray(e)||e.length===0)throw new Error("Sprite.addAnimation: frames array is required");return e.forEach(s=>{s.parent=this}),this._animations.set(t,{frames:e,loop:i.loop!==void 0?i.loop:!0,frameRate:i.frameRate||null}),this}removeAnimation(t){const e=this._animations.get(t);return e?(e.frames.forEach(i=>{i.parent=null}),this._animations.delete(t),this._currentAnimation===t&&(this._currentAnimation=null,this._frames=[]),!0):!1}playAnimation(t,e=!1){const i=this._animations.get(t);return i?this._currentAnimation===t&&this._isPlaying&&!e?this:(this._currentAnimation=t,this._frames=i.frames,this._loop=i.loop,i.frameRate!==null&&(this._frameRate=i.frameRate,this._frameDuration=1/this._frameRate),this._currentFrame=0,this._frameAccumulator=0,this._isPlaying=!0,this):(console.warn(`Sprite.playAnimation: animation '${t}' not found`),this)}stopAnimation(t){const e=this._animations.get(t);return e?(this._currentAnimation=t,this._frames=e.frames,this._loop=e.loop,this._currentFrame=0,this._frameAccumulator=0,this._isPlaying=!1,this):(console.warn(`Sprite.stopAnimation: animation '${t}' not found`),this)}get currentAnimationName(){return this._currentAnimation}get animationNames(){return Array.from(this._animations.keys())}hasAnimation(t){return this._animations.has(t)}addFrame(t){if(!t)throw new Error("Sprite.addFrame: shape is required");return t.parent=this,this._frames.push(t),this.markBoundsDirty(),this._frames.length-1}removeFrame(t){if(t<0||t>=this._frames.length)return null;const e=this._frames.splice(t,1)[0];return e&&(e.parent=null,this.markBoundsDirty(),this._currentFrame>=this._frames.length&&this._frames.length>0&&(this._currentFrame=this._frames.length-1)),e}clearFrames(){this._frames.forEach(t=>{t.parent=null}),this._frames=[],this._currentFrame=0,this.markBoundsDirty()}get totalFrames(){return this._frames.length}get currentFrame(){return this._currentFrame}get currentShape(){return this._frames[this._currentFrame]||null}get frames(){return this._frames}get isPlaying(){return this._isPlaying}get loop(){return this._loop}set loop(t){this._loop=t}get frameRate(){return this._frameRate}set frameRate(t){if(t<=0)throw new Error("Sprite.frameRate must be greater than 0");this._frameRate=t,this._frameDuration=1/t}play(){return this._isPlaying=!0,this}pause(){return this._isPlaying=!1,this}stop(){return this._isPlaying=!1,this._currentFrame=0,this._frameAccumulator=0,this}rewind(){return this._currentFrame=0,this._frameAccumulator=0,this}goto(t){return this._frames.length===0?this:(this._currentFrame=Math.max(0,Math.min(t,this._frames.length-1)),this._frameAccumulator=0,this)}gotoAndStop(t){return this.goto(t),this.pause(),this}gotoAndPlay(t){return this.goto(t),this.play(),this}update(t){if(super.update(t),!this._isPlaying||this._frames.length===0)return;for(this._frameAccumulator+=t;this._frameAccumulator>=this._frameDuration;)this._frameAccumulator-=this._frameDuration,this._advanceFrame();const e=this.currentShape;e&&typeof e.update=="function"&&e.update(t)}_advanceFrame(){this._currentFrame++,this._currentFrame>=this._frames.length&&(this._loop?this._currentFrame=0:(this._currentFrame=this._frames.length-1,this._isPlaying=!1))}draw(){super.draw();const t=this.currentShape;t&&t.visible!==!1&&(v.save(),t.render(),v.restore())}calculateBounds(){if(this._frames.length===0)return{x:this.x,y:this.y,width:0,height:0};let t=1/0,e=1/0,i=-1/0,s=-1/0;return this._frames.forEach(n=>{const r=n.getBounds();t=Math.min(t,r.x),e=Math.min(e,r.y),i=Math.max(i,r.x+r.width),s=Math.max(s,r.y+r.height)}),{x:t+this.x,y:e+this.y,width:i-t,height:s-e}}toString(){return`[Sprite frames=${this.totalFrames} current=${this.currentFrame} playing=${this.isPlaying}]`}}class He extends ki{constructor(t,e={}){super(t,{frameRate:e.frameRate||12,loop:e.loop!==void 0?e.loop:!0,autoPlay:!1,...e}),this._src=e.src,this._frameWidth=e.frameWidth,this._frameHeight=e.frameHeight,this._columns=e.columns,this._rows=e.rows,this._frameCount=e.frameCount||e.columns*e.rows,this._startFrame=e.startFrame||0,this._smoothing=e.smoothing!==void 0?e.smoothing:!1,this._autoPlayAfterLoad=e.autoPlay||!1,this._loaded=!1,this._loading=!1,this._image=null,this._frameCanvases=[],this.width=this._frameWidth,this.height=this._frameHeight}static async create(t,e){const i=new He(t,e);return await i.load(),i}async load(){if(this._loaded||this._loading)return this;this._loading=!0;try{return this._image=await this._loadImage(this._src),await this._sliceFrames(),this._loaded=!0,this._loading=!1,this._autoPlayAfterLoad&&this.play(),this}catch(t){throw this._loading=!1,console.error("SpriteSheet.load failed:",t),t}}_loadImage(t){return new Promise((e,i)=>{const s=new Image;s.onload=()=>e(s),s.onerror=n=>i(new Error(`Failed to load image: ${t}`)),s.src=t})}async _sliceFrames(){const{_image:t,_frameWidth:e,_frameHeight:i,_columns:s}=this;this.clearFrames(),this._frameCanvases=[];for(let n=this._startFrame;n<this._startFrame+this._frameCount;n++){const r=n%s,o=Math.floor(n/s),a=r*e,l=o*i,c=document.createElement("canvas");c.width=e,c.height=i;const u=c.getContext("2d");u.imageSmoothingEnabled=this._smoothing,u.drawImage(t,a,l,e,i,0,0,e,i),this._frameCanvases.push(c);const h=new be(c,{width:e,height:i,anchor:"center",smoothing:this._smoothing});this.addFrame(h)}}get loaded(){return this._loaded}get loading(){return this._loading}get frameWidth(){return this._frameWidth}get frameHeight(){return this._frameHeight}get columns(){return this._columns}get rows(){return this._rows}update(t){this._loaded&&super.update(t)}draw(){this._loaded&&super.draw()}toString(){return`[SpriteSheet src="${this._src}" frames=${this._frameCount} loaded=${this._loaded}]`}}class os extends Di{constructor(t,e,i={}){const s=e instanceof be?e:new be(e,i);super(t,s,i)}reset(){this.shape.reset()}}class Rt{static lerp(t,e,i){return t+(e-t)*i}static lerpAngle(t,e,i){let s=e-t;for(;s<-Math.PI;)s+=Math.PI*2;for(;s>Math.PI;)s-=Math.PI*2;return t+s*i}static tweenColor(t,e,i){return t.map((s,n)=>Rt.lerp(s,e[n],i))}static tweenGradient(t,e,i){let s=t[0],n=e[0];Math.abs(n-s)>180&&(s<n?s+=360:n+=360);const r=Rt.lerp(s,n,i)%360,o=Rt.lerp(t[1],e[1],i),a=Rt.lerp(t[2],e[2],i);return[r,o,a]}}function Ei(f,t,e,i,s,n=!1,r=null,o={},a=null){const{t:l,easedT:c,completed:u,state:h}=W._frame(i,s,n,r,o,a),d=1/(e+1),m=Math.min(Math.floor(c/d),e),g=c%d/d,p=f*Math.pow(.6,m),b=Math.sin(g*Math.PI),y=t-b*(t-p);return W.animationResult({y,segment:m,bounceHeight:p},l,n,u,h)}function Ii(f,t,e,i,s,n,r=!0,o=null,a={},l=null){if(e<=0)return W.animationResult({x:f.x,y:f.y,moving:!1},1,!1,!0);l||(l={initialX:f.x,initialY:f.y,started:!1,completed:!1,loopCount:0});const c=l.initialX,u=l.initialY,{t:h,easedT:d,completed:m,state:g}=W._frame(t,e,r,o,a,l);l={...l,...g};const p=t*i,b=Math.max(0,Math.min(1,s)),y=.7,w=.9,x=2.3,S=1.9,C=Math.sin(p*y)+b*.4*Math.sin(p*x+.5),R=Math.cos(p*w)+b*.4*Math.cos(p*S+.7),M=c+C*n,T=u+R*n,A=y*Math.cos(p*y)+b*.4*x*Math.cos(p*x+.5),k=-.9*Math.sin(p*w)+b*.4*-1.9*Math.sin(p*S+.7),P=Math.sqrt(A*A+k*k),D=P>.8,I=Math.sqrt((M-c)*(M-c)+(T-u)*(T-u));return W.animationResult({x:M,y:T,centerX:c,centerY:u,offsetX:M-c,offsetY:T-u,distance:I,moving:D,velocity:P},h,r,m,l)}function Pi(f,t=!1,e,i,s=!1,n=null,r={},o=null){if(!f||f.length<2)return this._createResult({x:0,y:0},0,s,!1);const{t:a,easedT:l,completed:c,state:u}=W._frame(e,i,s,n,r,o);if(!o||!o.pathData){const M={segmentLengths:[],totalLength:0,points:[...f]};for(let T=0;T<f.length-1;T++){const A=f[T],k=f[T+1],P=k[0]-A[0],D=k[1]-A[1],I=Math.sqrt(P*P+D*D);M.segmentLengths.push(I),M.totalLength+=I}if(t){const T=f[f.length-1],A=f[0],k=A[0]-T[0],P=A[1]-T[1],D=Math.sqrt(k*k+P*P);M.segmentLengths.push(D),M.totalLength+=D}u.pathData=M}const{segmentLengths:h,totalLength:d,points:m}=u.pathData,g=l*d;let p=0,b=0;for(let M=0;M<h.length;M++){if(p+h[M]>=g){b=M;break}p+=h[M]}const y=(g-p)/h[b],w=m[b],x=b<m.length-1?m[b+1]:m[0],S=Rt.lerp(w[0],x[0],y),C=Rt.lerp(w[1],x[1],y),R=Math.atan2(x[1]-w[1],x[0]-w[0]);return W.animationResult({x:S,y:C,angle:R,segmentIndex:b,segmentProgress:y,pathProgress:l},a,s,c,u)}function Bi(f,t,e,i,s,n,r,o=!0,a=!0,l=null,c={},u=null){const{t:h,easedT:d,completed:m,state:g}=W._frame(n,r,o,l,c,u),b=s+(a?1:-1)*d*Math.PI*2,y=f+e*Math.cos(b),w=t+i*Math.sin(b);return W.animationResult({x:y,y:w,angle:b},h,o,m,g)}function Xi(f,t,e,i,s=!0,n=null,r={},o=null){const{t:a,easedT:l,completed:c,state:u}=W._frame(e,i,s,n,r,o),h=(t-f)/2,m=f+h+h*Math.sin(l*Math.PI*2);return W.animationResult({value:m},a,s,c,u)}function zi(f,t,e,i,s,n=!1,r=!1,o=null,a={},l=null){l||(l={started:!1,loopCount:0,direction:1,lastDirection:1,completed:!1});let c=s>0?i/s:1,u=!1,h={...a};if(r||n)if(n)if(r){const w=s*2,x=i%w,S=Math.floor(i/w),C=x<s?1:-1;c=C===1?x/s:2-x/s,C!==l.direction&&(l.direction=C,l.direction===1&&h.onLoop&&h.onLoop(S)),S>l.loopCount&&(l.loopCount=S)}else{c=c%1;const w=Math.floor(i/s);w>l.loopCount&&h.onLoop&&(h.onLoop(w),l.loopCount=w)}else r&&!n&&(c<=1?l.direction=1:c<=2?(c=2-c,l.direction=-1):(c=0,u=!0,l.direction=1));else c>=1&&(c=1,u=!0);!l.started&&h.onStart&&(h.onStart(),l.started=!0),u&&!l.completed&&h.onComplete&&(h.onComplete(),l.completed=!0);const d=o?o(c):c,m=f+e-2*t,g=2*(t-f),p=f,b=m*d*d+g*d+p,y={...l,lastDirection:l.direction,completed:u||l.completed};return W.animationResult({value:b,direction:l.direction},c,n||r&&!u,u,y)}function Oi(f,t,e,i,s,n,r=!0,o=null){o||(o={currentX:f,currentY:t,targetX:f,targetY:t,isWaiting:!0,waitStartTime:0,moveStartTime:0,moveCount:0,direction:"idle"});const a=()=>Math.random();let l=o.isWaiting,c=o.currentX,u=o.currentY,h=o.direction;if(l){if(e-o.waitStartTime>=s){l=!1,o.moveStartTime=e,h=["up","down","left","right"][Math.floor(a()*4)];let b=o.currentX,y=o.currentY;const w=n*(.2+a()*.6);switch(h){case"up":y=o.currentY-w;break;case"down":y=o.currentY+w;break;case"left":b=o.currentX-w;break;case"right":b=o.currentX+w;break}Math.pow(b-f,2)+Math.pow(y-t,2)>n*n&&(h==="up"||h==="down"?(y=t,h=o.currentY>t?"up":"down"):(b=f,h=o.currentX>f?"left":"right")),o.targetX=b,o.targetY=y,o.direction=h,o.moveCount++}}else{const p=(e-o.moveStartTime)/i;p>=1?(l=!0,o.waitStartTime=e,o.currentX=o.targetX,o.currentY=o.targetY,h="idle"):(c=o.currentX+(o.targetX-o.currentX)*p,u=o.currentY+(o.targetY-o.currentY)*p)}o.isWaiting=l,o.direction=h,l||(o.currentX=c,o.currentY=u);const d=i+s,m=e%d/d,g=Math.sqrt(Math.pow(c-f,2)+Math.pow(u-t,2));return W.animationResult({x:c,y:u,moving:!l,direction:h,distanceFromCenter:g},m,r,!1,o)}function Yi(f,t,e,i,s=!0,n=!1,r=null,o={},a=null){const{t:l,easedT:c,completed:u,state:h}=W._frame(e,i,s,null,o,a),d=n&&!s?Math.exp(-4*l):1;let m=f+t*Math.cos(c*2*Math.PI)*d;if(r){const g=(m-f)/(t*d);m=f+r((g+1)/2)*t*d*2-t*d}return W.animationResult({angle:m},l,s,u,h)}function Li(f,t,e,i,s=!0,n=!1,r=null,o={}){let a=e/i,l="forward";if(s){const h=Math.floor(a);a=a%1,h>0&&o.onLoop&&o.onLoop(h)}else a>1&&(a=1);a>0&&e<=i&&o.onStart&&o.onStart();let c;if(n)if(a<.5){const h=a*2,d=r?r(h):h;c=f+(t-f)*d,l="forward"}else{const h=(a-.5)*2,d=r?r(h):h;c=t-(t-f)*d,l="return",a>=.5&&a<.51&&o.onYoyoTurn&&o.onYoyoTurn()}else{const h=r?r(a):a,d=h<.5?h*2:2-h*2;c=f+(t-f)*d}const u=!s&&a>=1;return u&&o.onComplete&&o.onComplete(),W.animationResult({value:c,phase:l},a,s,u)}function Fi(f,t,e,i,s=!0,n=!0,r=null,o={},a=null){const{t:l,easedT:c,completed:u,state:h}=W._frame(e,i,s,r,o,a,n);let d=0;!s&&!n?d=u?1:Math.sin(Math.min(l,1)*Math.PI*.5):n?d=Math.sin(c*Math.PI):d=Math.sin(Math.min(l,1)*Math.PI*.5);const m=f-t*d;return W.animationResult({y:m},l,s,u,h)}function Ni(f,t,e,i,s,n,r,o,a=!1,l=null,c={},u=null){const{t:h,easedT:d,completed:m,state:g}=W._frame(r,o,a,l,c,u),p=Math.pow(1-d,n),b=d*Math.PI*2*s,y=d*Math.PI*2*s*1.3,w=p*e*(Math.sin(b)*.6+Math.sin(b*2.5)*.3+Math.sin(b*5.6)*.1),x=p*i*(Math.cos(y)*.6+Math.cos(y*2.7)*.3+Math.cos(y*6.3)*.1);let S=f+w,C=t+x;if(d>.9){const R=(d-.9)/.1;S=f+w*(1-R),C=t+x*(1-R)}return W.animationResult({x:S,y:C,intensity:p},h,a,m,g)}function Wi(f,t,e,i,s,n,r,o,a=!1,l=!1,c=null,u={},h=null){h||(h={started:!1,loopCount:0,direction:1,lastDirection:1});let d=o>0?r/o:1,m=!1,g={...u};if(l||a)if(a)if(l){const C=o*2,R=r%C,M=Math.floor(r/C),T=R<o?1:-1;d=T===1?R/o:2-R/o,T!==h.direction&&(h.direction=T,h.direction===1&&g.onLoop&&g.onLoop(M)),M>h.loopCount&&(h.loopCount=M)}else{d=d%1;const C=Math.floor(r/o);C>h.loopCount&&g.onLoop&&(g.onLoop(C),h.loopCount=C)}else l&&!a&&(d<=1?h.direction=1:d<=2?(d=2-d,h.direction=-1):(d=0,m=!0,h.direction=1));else d>=1&&(d=1,m=!0);!h.started&&g.onStart&&(g.onStart(),h.started=!0),m&&!h.completed&&g.onComplete&&(g.onComplete(),h.completed=!0);const p=c?c(d):d,b=Rt.lerp(e,i,p),y=s+p*n*Math.PI*2,w=f+b*Math.cos(y),x=t+b*Math.sin(y),S={...h,lastDirection:h.direction};return W.animationResult({x:w,y:x,radius:b,angle:y,direction:h.direction},d,a||l&&!m,m,S)}function Gi(f,t,e,i,s=!1,n=!1,r={},o={}){if(i<=0)return this.animationResult({value:t,velocity:0,done:!0,phase:"complete"},1,!1,!0);let a=e/i,l="forward",c=0;s?(c=Math.floor(a),a=a%1,c>0&&o.onLoop&&o.onLoop(c)):a>1&&(a=1),a>0&&e<=i&&o.onStart&&o.onStart();let u,h,d;n?a>=.5?(u=f,h=t,d=(a-.5)*2,l="return",a>=.5&&a<.51&&o.onYoyoTurn&&o.onYoyoTurn()):(u=t,h=f,d=a*2,l="forward"):(u=t,h=f,d=a);const m=r.stiffness!==void 0?r.stiffness:.3,g=r.damping!==void 0?r.damping:.6,p=Math.max(.1,1/(g*1.5)),b=Math.max(.1,.8/(m*1.5+.5));let y;if(d<.99)y=Et.easeOutElastic(d,p,b);else{const A=(d-.99)/.01;y=Et.easeOutElastic(.99,p,b)*(1-A)+1*A}const w=Rt.lerp(h,u,y),x=.01,S=Math.min(d+x,1);let C;if(S<.99)C=Et.easeOutElastic(S,p,b);else{const A=(S-.99)/.01;C=Et.easeOutElastic(.99,p,b)*(1-A)+1*A}const M=(Rt.lerp(h,u,C)-w)/x*i,T=!s&&a>=1;return T&&o.onComplete&&o.onComplete(),W.animationResult({value:w,velocity:M,delta:l==="forward"?t-w:f-w,done:T,phase:l},a,s,T)}function Ui(f,t,e,i,s,n=!0,r=!0,o=null,a={},l=null){const{t:c,easedT:u,completed:h,state:d}=W._frame(i,s,n,o,a,l),g=Math.sin(r?u*Math.PI*2:u*Math.PI)*e;return W.animationResult({angle:g},c,n,h,d)}function Hi(f,t,e,i,s,n=!0,r={},o=null){if(!e||!Array.isArray(e)||e.length<2)return console.warn("Patrol animation requires at least 2 waypoints"),W._createResult({x:0,y:0,moving:!1,direction:"idle",waypoint:0},0,!1,!0);o||(o={currentWaypoint:0,nextWaypoint:1,isWaiting:!0,waitStartTime:0,lastWaypointTime:0,lastWaypointReached:-1,completed:!1});let a=0;for(let M=0;M<e.length;M++){const T=(M+1)%e.length;if(!n&&M===e.length-1)break;const A=e[T][0]-e[M][0],k=e[T][1]-e[M][1];a+=Math.abs(A)+Math.abs(k)}const l=a/i,c=s*e.length,u=l+c;let h=t;n?h=t%u:h=Math.min(t,u);const d=h/u;let m=h,g=0,p=1,b=!0,y=0,w=0,x=!1;if(m<s)y=m/s,g=0,p=1,b=!0;else{m-=s;for(let M=0;M<e.length;M++){if(!n&&M===e.length-1){g=M,p=M,b=!0,y=1,x=!0;break}const T=(M+1)%e.length,A=e[T][0]-e[M][0],k=e[T][1]-e[M][1],D=(Math.abs(A)+Math.abs(k))/i;if(m<D){g=M,p=T,b=!1,w=m/D;break}if(m-=D,m<s){g=T,p=(T+1)%e.length,b=!0,y=m/s,o.lastWaypointReached!==g&&(r.onWaypointReached&&r.onWaypointReached(g),r.onWaitStart&&r.onWaitStart(g),o.lastWaypointReached=g);break}m-=s}}let S,C,R;if(b||x)S=e[g][0],C=e[g][1],R="idle",!o.isWaiting&&b&&r.onWaitEnd&&r.onWaitEnd(g);else{const M=e[g],T=e[p],A=T[0]-M[0],k=T[1]-M[1],P=Math.abs(A)+Math.abs(k),D=Math.abs(A)/P;if(w<=D&&A!==0){const I=w/D;S=M[0]+A*I,C=M[1],R=A>0?"right":"left"}else{const I=(w-D)/(1-D);S=T[0],C=M[1]+k*I,R=k>0?"down":"up"}}return o.currentWaypoint=g,o.nextWaypoint=p,o.isWaiting=b,!o.completed&&x&&r.onPatrolComplete&&(r.onPatrolComplete(),o.completed=!0),W.animationResult({x:S,y:C,moving:!b,waiting:b,waitProgress:b?y:0,direction:R,waypoint:g,nextWaypoint:p},d,n,x,o)}class W{static animationResult(t,e,i,s=!1,n=null){return{...t,t:e,progress:e,loop:i,completed:s,state:n}}static _step(t,e,i,s={},n={started:!1,loopCount:0}){let r=e>0?t/e:1,o=!1;if(n=n||{started:!1,loopCount:0},!n.started&&s.onStart&&(s.onStart(),n.started=!0),i){r=r%1;const a=Math.floor(t/e);a>n.loopCount&&s.onLoop&&(s.onLoop(a),n.loopCount=a)}else r>=1&&(r=1,o=!0,!n.completed&&s.onComplete&&(s.onComplete(),n.completed=!0));return{t:r,completed:o,state:n}}static _frame(t,e,i,s=null,n={},r=null){const{t:o,completed:a,state:l}=this._step(t,e,i,n,r),c=s?s(o):o;return{t:o,easedT:c,completed:a,state:l}}static oscillate(t,e,i,s,n=!0,r=null,o={},a=null){return Xi(t,e,i,s,n,r,o,a)}static parabolic(t,e,i,s,n,r=!1,o=!1,a=null,l={},c=null){return zi(t,e,i,s,n,r,o,a,l,c)}static float(t,e,i,s,n,r,o=!0,a=null,l={},c=null){return Ii(t,e,i,s,n,r,o,a,l,c)}static spring(t,e,i,s,n=!1,r=!1,o={},a={}){return Gi(t,e,i,s,n,r,o,a)}static swing(t,e,i,s,n,r=!0,o=!0,a=null,l={},c=null){return Ui(t,e,i,s,n,r,o,a,l,c)}static pendulum(t,e,i,s,n=!0,r=!1,o=null,a={},l=null){return Yi(t,e,i,s,n,r,o,a,l)}static pulse(t,e,i,s,n=!0,r=!1,o=null,a={}){return Li(t,e,i,s,n,r,o,a={})}static spiral(t,e,i,s,n,r,o,a,l=!1,c=!1,u=null,h={},d=null){return Wi(t,e,i,s,n,r,o,a,l,c,u,h,d)}static orbit(t,e,i,s,n,r,o,a=!0,l=!0,c=null,u={},h=null){return Bi(t,e,i,s,n,r,o,a,l,c,u,h)}static bezier(t,e,i,s,n,r,o=!1,a=!1,l=null,c={},u=null){return qi(t,e,i,s,n,r,o,a,l,c,u)}static bounce(t,e,i,s,n,r=!1,o=null,a={},l=null){return Ei(t,e,i,s,n,r,o,a,l)}static shake(t,e,i,s,n,r,o,a,l=!1,c=null,u={},h=null){return Ni(t,e,i,s,n,r,o,a,l,c,u,h)}static follow(t,e=!1,i,s,n=!1,r=null,o={},a=null){return Pi(t,e,i,s,n,r,o,a)}static waypoint(t,e,i,s,n,r=!0,o={},a=null){return Hi(t,e,i,s,n,r,o,a)}static patrol(t,e,i,s,n,r,o=!0,a=null){return Oi(t,e,i,s,n,r,o,a)}static hop(t,e,i,s,n=!0,r=!0,o=null,a={},l=null){return Fi(t,e,i,s,n,r,o,a,l)}static group(t,e,i,s,n=!1,r=null,o={},a=null){a||(a={started:!1,loopCount:0,animationStates:Array(t.length).fill(null)});const{t:l,easedT:c,completed:u,state:h}=this._frame(i,s,n,r,o,a),d={};for(let m=0;m<t.length;m++){const g=t[m],p=[...e[m]];g===this.parabolic||g===this.oscillate||g===this.pulse?(p[3]=i,p[4]=s,p[5]=n,p[6]===void 0&&(p[6]=r)):g===this.spring?(p[2]=i,p[3]=s,p[4]=n):g===this.spiral||g===this.bezier?(p[6]=i,p[7]=s,p[8]=n,p[9]===void 0&&(p[9]=r)):g===this.orbit?(p[5]=i,p[6]=s,p[7]=n,p[9]===void 0&&(p[9]=r)):g===this.bounce||g===this.shake?(p[6]=i,p[7]=s,p[8]=n,p[9]===void 0&&(p[9]=r)):g===this.followPath&&(p[2]=i,p[3]=s,p[4]=n,p[5]===void 0&&(p[5]=r)),p.push(o),p.push(h.animationStates[m]);const b=g.apply(this,p);h.animationStates[m]=b.state;const y=`anim${m}`;d[y]=b}return this.animationResult(d,l,n,u,h)}static sequence(t,e,i,s,n=!1,r=null,o={},a=null,l=null){if(!l){l={started:!1,loopCount:0,animationStates:Array(t.length).fill(null),currentAnim:0,animStartTimes:[0],totalDuration:0};let x=0;for(let S=0;S<i.length;S++)x+=i[S],S<i.length-1&&l.animStartTimes.push(x);l.totalDuration=x}let c=s;if(n&&l.totalDuration>0){c=s%l.totalDuration;const x=Math.floor(s/l.totalDuration);x>l.loopCount&&o.onLoop&&(o.onLoop(x),l.loopCount=x)}!l.started&&o.onStart&&(o.onStart(),l.started=!0);let u=0;for(let x=t.length-1;x>=0;x--)if(c>=l.animStartTimes[x]){u=x;break}l.currentAnim=u;const h=l.animStartTimes[u],d=c-h,m=i[u],g=t[u],p=[...e[u]];g===this.parabolic||g===this.oscillate||g===this.pulse?(p[3]=d,p[4]=m,p[5]=!1,r&&r[u]&&(p[6]=r[u])):g===this.spring?(p[2]=d,p[3]=m,p[4]=!1):g===this.spiral||g===this.bezier?(p[6]=d,p[7]=m,p[8]=!1,r&&r[u]&&(p[9]=r[u])):g===this.orbit?(p[5]=d,p[6]=m,p[7]=!1,r&&r[u]&&(p[9]=r[u])):g===this.bounce||g===this.shake?(p[6]=d,p[7]=m,p[8]=!1,r&&r[u]&&(p[9]=r[u])):g===this.followPath&&(p[2]=d,p[3]=m,p[4]=!1,r&&r[u]&&(p[5]=r[u]));const b=a&&a[u]?a[u]:{},y=g.apply(this,[...p,b,l.animationStates[u]]);l.animationStates[u]=y.state;const w=!n&&c>=l.totalDuration;return w&&!l.completed&&o.onComplete&&(o.onComplete(),l.completed=!0),this.animationResult({...y,currentAnim:u,totalAnimations:t.length,sequenceProgress:Math.min(c/l.totalDuration,1)},c/l.totalDuration,n,w,l)}}function qi(f,t,e,i,s,n,r=!1,o=!1,a=null,l={},c=null){if(n<=0)return W.animationResult({x:i[0],y:i[1],phase:"complete"},1,!1,!0);let u=s/n,h="forward",d=0;r?(d=Math.floor(u),u=u%1,d>0&&l.onLoop&&l.onLoop(d)):u>1&&(u=1),u>0&&s<=n&&l.onStart&&l.onStart();let g=a?a(u):u;o&&(u>=.5?(g=1-(u-.5)*2,h="return",u>=.5&&u<.51&&l.onYoyoTurn&&l.onYoyoTurn()):(g=u*2,h="forward"),g=a?a(g):g);const p=3*(t[0]-f[0]),b=3*(e[0]-t[0])-p,y=i[0]-f[0]-p-b,w=3*(t[1]-f[1]),x=3*(e[1]-t[1])-w,S=i[1]-f[1]-w-x,C=y*Math.pow(g,3)+b*Math.pow(g,2)+p*g+f[0],R=S*Math.pow(g,3)+x*Math.pow(g,2)+w*g+f[1],M=!r&&u>=1;return M&&l.onComplete&&l.onComplete(),W.animationResult({x:C,y:R,phase:h},u,r,M,c)}class Ct{constructor(t,e,i,s,n={}){this.target=t,this.toProps={...e},this.duration=i,this.easingFn=s||Et.easeOutQuad,this.delay=n.delay||0,this.onStart=n.onStart||null,this.onComplete=n.onComplete||null,this.onUpdate=n.onUpdate||null,this._elapsed=0,this._started=!1,this._finished=!1,this._startProps={};for(const r in this.toProps)r in this.target&&(this._startProps[r]=this.target[r])}static to(t,e,i,s,n){const r=new Ct(t,e,i,s,n);return Ct._active.push(r),r}update(t){if(this._finished||(this._elapsed+=t,this._elapsed<this.delay))return;const e=this._elapsed-this.delay,i=Math.min(e/this.duration,1);!this._started&&i>0&&(this._started=!0,this.onStart&&this.onStart());const s=this.easingFn(i);for(const n in this._startProps){const r=this._startProps[n],o=this.toProps[n];this.target[n]=Rt.lerp(r,o,s)}this.onUpdate&&this.onUpdate(),i>=1&&(this._finished=!0,this.onComplete&&this.onComplete())}static updateAll(t){for(const e of Ct._active)e.update(t);Ct._active=Ct._active.filter(e=>!e._finished)}static killTarget(t){Ct._active=Ct._active.filter(e=>e.target!==t)}static killAll(){Ct._active=[]}}class Zi extends Ye{constructor(t){super(),this.game=t,this._collection=new Te,this._collection._owner=this,["inputdown","inputup","inputmove","click"].forEach(i=>{this.game.events.on(i,s=>{this.dispatchInputEvent(i,s)})})}_hoverObject(t,e){if(!t.interactive||!t._hitTest)return;const i=t._hitTest(e.x,e.y);i&&!t._hovered?(t._hovered=!0,t.events.emit("mouseover",e)):!i&&t._hovered&&(t._hovered=!1,t.events.emit("mouseout",e))}_hoverScene(t,e){if(t.children&&t.children.length>0)for(let i=t.children.length-1;i>=0;i--){const s=t.children[i];s instanceof ae?this._hoverScene(s,e):this._hoverObject(s,e)}this._hoverObject(t,e)}dispatchInputEvent(t,e){var i;for(let s=this.gameObjects.length-1;s>=0;s--){const n=this.gameObjects[s];if(n instanceof ae){if(this._dispatchToScene(n,t,e))break}else if(n.interactive&&((i=n._hitTest)!=null&&i.call(n,e.x,e.y))){n.events.emit(t,e);break}}t==="inputmove"&&this._dispatchHover(e)}_dispatchHover(t){for(let e=this.gameObjects.length-1;e>=0;e--){const i=this.gameObjects[e];i instanceof ae?this._hoverScene(i,t):this._hoverObject(i,t)}}_dispatchToScene(t,e,i){var s,n;for(let r=t.children.length-1;r>=0;r--){const o=t.children[r];if(o instanceof ae){if(this._dispatchToScene(o,e,i))return!0}else if(o.interactive&&((s=o._hitTest)!=null&&s.call(o,i.x,i.y)))return o.events.emit(e,i),!0}return t.interactive&&((n=t._hitTest)!=null&&n.call(t,i.x,i.y))?(t.events.emit(e,i),!0):!1}add(t){t.parent=this.game;const e=this._collection.add(t);return e.init&&e.init(),e}remove(t){if(t==null){this.logger.warn("Cannot remove undefined or null object",t);return}this._collection.remove(t)}bringToFront(t){return this._collection.bringToFront(t)}sendToBack(t){return this._collection.sendToBack(t)}bringForward(t){return this._collection.bringForward(t)}sendBackward(t){return this._collection.sendBackward(t)}clear(){return this._collection.clear()}get gameObjects(){return this._collection.children}update(t){this.logger.groupCollapsed("Pipeline.update"),this._collection.children.filter(e=>e.active).forEach(e=>e.update(t)),Ct.updateAll(t),this.logger.groupEnd()}render(){const t=s=>s.render(),e=s=>s.visible,i=s=>s.active;this.logger.groupCollapsed("Pipeline.render"),this._collection.getSortedChildren().filter(e).filter(i).forEach(t),this.logger.groupEnd()}}class ns{constructor(t){Y(this,le,0),Y(this,ce,0),this.canvas=t,this.ctx=t.getContext("2d"),this.events=new Ue,this._cursor=null,this.lastTime=0,this.dt=0,this.running=!1,this._frame=0,this.pipeline=new Zi(this),v.init(this.ctx),this.targetFPS=60,this._frameInterval=1e3/this.targetFPS,this._accumulator=0,this._pauseOnBlur=!1,this._isPaused=!1,this._init=!1,this.initLogging()}setFPS(t){this.targetFPS=t,this._frameInterval=1e3/t}init(){this.initIO(),this.initMotion(),this._init=!0,this.logger.log("[Game] Initialized")}initMouse(){Ci.init(this)}initTouch(){Ri.init(this)}initInput(){F.init(this)}initKeyboard(){Ti.init(this)}initIO(){this.initMouse(),this.initTouch(),this.initInput(),this.initKeyboard()}initMotion(){Ct._active=[]}initLogging(){this.logger=new St("Game"),St.setOutput(console),St.disableAll(),St.disable(),St.setLevel(St.INFO),this.logger.groupCollapsed("Initializing Game...")}enableLogging(){St.enable()}disableLogging(){St.disableAll(),St.disable()}markBoundsDirty(){this._boundsDirty=!0}get boundsDirty(){return this._boundsDirty}set boundsDirty(t){this._boundsDirty=t}enableFluidSize(t=window,e={}){const{top:i=0,right:s=0,bottom:n=0,left:r=0}=e;if(t===window){const o=()=>{var a;this.canvas.width=window.innerWidth-r-s,this.canvas.height=window.innerHeight-i-n,(_(this,le)!==this.canvas.width||_(this,ce)!==this.canvas.height)&&(this.markBoundsDirty(),(a=this.onResize)==null||a.call(this)),N(this,le,this.canvas.width),N(this,ce,this.canvas.height)};o(),window.addEventListener("resize",o),this._fluidResizeCleanup=()=>{window.removeEventListener("resize",o)}}else{if(!("ResizeObserver"in window)){console.warn("ResizeObserver not supported in this browser.");return}const o=()=>{const l=t.getBoundingClientRect();this.canvas.width=l.width-r-s,this.canvas.height=l.height-i-n},a=new ResizeObserver(()=>{o()});a.observe(t),o(),this._fluidResizeCleanup=()=>a.disconnect()}}disableFluidSize(){this._fluidResizeCleanup&&(this._fluidResizeCleanup(),this._fluidResizeCleanup=null)}start(){if(this.logger.groupCollapsed("[Game] Starting..."),this.init(),!this._init)throw new Error("Game not initialized. Did you call init()? Remember to call super.init() in your subclass.");this.running=!0,this.loop=this.loop.bind(this),requestAnimationFrame(this.loop),this.logger.log("[Game] Started"),this.logger.groupEnd()}stop(){this.running=!1,this.logger.log("[Game] Stopped")}restart(){this.pipeline.clear(),this.init(),this.start(),this.logger.log("[Game] Restarted")}loop(t){if(!this.running)return;const e=t-this.lastTime;if(this.lastTime=t,this._accumulator+=e,this.actualFps=1e3/e,this._accumulator>=this._frameInterval){const i=this._frameInterval/1e3;this.dt=i,this._frame++,this.logger.groupCollapsed(`Frame #${this._frame}`),this.logger.time("render time"),this.update(i),this.render(),this.logger.timeEnd("render time"),this.logger.groupEnd(),this._accumulator-=this._frameInterval}this.boundsDirty&&(this.boundsDirty=!1),requestAnimationFrame(this.loop)}update(t){this.pipeline.update(t)}render(){v.setContext(this.ctx),this.running&&this.clear(),this.pipeline.render()}clear(){v.clear()}get width(){return this.canvas.width}get height(){return this.canvas.height}set backgroundColor(t){this.canvas.style.backgroundColor=t}set cursor(t){this._cursor&&(this._cursor.destroy(),this.pipeline.remove(this._cursor)),this._cursor=t,this._cursor.activate(),this.pipeline.add(t)}get cursor(){return this._cursor}resetCursor(){this._cursor&&(this._cursor.destroy(),this.pipeline.remove(this._cursor),this._cursor=null)}enablePauseOnBlur(t){this._pauseOnBlur=t,t?window.addEventListener("visibilitychange",this._handleVisibilityChange.bind(this),!1):window.removeEventListener("visibilitychange",this._handleVisibilityChange.bind(this),!1)}_handleVisibilityChange(){this.logger.log("Visibility change detected"),document.hidden?this._pauseOnBlur&&this.running&&(this._isPaused=!0,this.stop(),this.logger.log("Paused due to tab visibility change")):this._isPaused&&(this._isPaused=!1,this.start(),this.logger.log("Resumed after tab visibility change"))}}le=new WeakMap;ce=new WeakMap;const pt={button:{default:{bg:"rgba(0, 0, 0, 0.85)",stroke:"rgba(0, 255, 0, 0.4)",text:"#0f0"},hover:{bg:"#0f0",stroke:"#0f0",text:"#000"},pressed:{bg:"#0c0",stroke:"#0f0",text:"#000"},active:{bg:"rgba(0, 255, 0, 0.15)",stroke:"#0f0",text:"#0f0"}}};class Vi extends Vt{constructor(t,e={}){super(t,e);const{x:i=0,y:s=0,width:n=120,height:r=40,text:o="Button",font:a="14px monospace",textColor:l="#000",textAlign:c="center",textBaseline:u="middle",shape:h=null,label:d=null,onClick:m=null,onHover:g=null,onPressed:p=null,onRelease:b=null,padding:y=10,colorDefaultBg:w=pt.button.default.bg,colorDefaultStroke:x=pt.button.default.stroke,colorDefaultText:S=pt.button.default.text,colorHoverBg:C=pt.button.hover.bg,colorHoverStroke:R=pt.button.hover.stroke,colorHoverText:M=pt.button.hover.text,colorPressedBg:T=pt.button.pressed.bg,colorPressedStroke:A=pt.button.pressed.stroke,colorPressedText:k=pt.button.pressed.text}=e;this.x=i,this.y=s,this.width=n,this.height=r,this.padding=y,this.textAlign=c,this.textBaseline=u,this.initColorScheme({colorDefaultBg:w,colorDefaultStroke:x,colorDefaultText:S,colorHoverBg:C,colorHoverStroke:R,colorHoverText:M,colorPressedBg:T,colorPressedStroke:A,colorPressedText:k}),this.initBackground(h),this.initLabel(o,a,l,d),this.initGroup(),this.initEvents(m,g,p,b),this.setState("default")}initColorScheme(t){this.colors={default:{bg:t.colorDefaultBg,stroke:t.colorDefaultStroke,text:t.colorDefaultText},hover:{bg:t.colorHoverBg,stroke:t.colorHoverStroke,text:t.colorHoverText},pressed:{bg:t.colorPressedBg,stroke:t.colorPressedStroke,text:t.colorPressedText}}}initBackground(t){this.bg=t??new di({width:this.width,height:this.height,color:this.colors.default.bg,stroke:this.colors.default.stroke,lineWidth:2})}initLabel(t,e,i,s){this.label=s??new Si(t,{font:e,color:i,align:this.textAlign,baseline:this.textBaseline}),this.alignText()}alignText(){if(!this.label)return;const t=this.width/2,e=this.height/2;switch(this.textAlign){case"left":this.label.x=-t+this.padding;break;case"right":this.label.x=t-this.padding;break;case"center":default:this.label.x=0;break}switch(this.textBaseline){case"top":this.label.y=-e+this.padding;break;case"bottom":this.label.y=e-this.padding;break;case"middle":default:this.label.y=0;break}}initGroup(){this.group=new fi,this.group.add(this.bg),this.group.add(this.label)}initEvents(t,e,i,s){this.interactive=!0,this.onHover=e,this.onPressed=i,this.onRelease=s,this.on("mouseover",this.setState.bind(this,"hover")),this.on("mouseout",this.setState.bind(this,"default")),this.on("inputdown",this.setState.bind(this,"pressed")),this.on("inputup",()=>{this.state==="pressed"&&typeof t=="function"&&t(),this.setState("hover")})}setState(t){var e,i,s;if(this.state!==t)switch(this.state=t,t){case"default":this.game.cursor&&setTimeout(()=>{this.game.cursor.activate()},0),this.bg.color=this.colors.default.bg,this.bg.stroke=this.colors.default.stroke,this.label.color=this.colors.default.text,this.game.canvas.style.cursor="default",(e=this.onRelease)==null||e.call(this);break;case"hover":this.game.cursor&&this.game.cursor.deactivate(),this.bg.color=this.colors.hover.bg,this.bg.stroke=this.colors.hover.stroke,this.label.color=this.colors.hover.text,this.game.canvas.style.cursor="pointer",(i=this.onHover)==null||i.call(this);break;case"pressed":this.game.cursor&&this.game.cursor.deactivate(),this.bg.color=this.colors.pressed.bg,this.bg.stroke=this.colors.pressed.stroke,this.label.color=this.colors.pressed.text,this.game.canvas.style.cursor="pointer",(s=this.onPressed)==null||s.call(this);break}}update(t){super.update(t),this._boundsDirty&&this.alignText()}get text(){return this.label.text}set text(t){this.label.text=t,this._boundsDirty=!0}setTextAlign(t){this.textAlign=t,this.label.align=t,this._boundsDirty=!0}setTextBaseline(t){this.textBaseline=t,this.label.baseline=t,this._boundsDirty=!0}setFont(t){this.label.font=t,this._boundsDirty=!0}resize(t,e){this.width=t,this.height=e,this.bg.width=t,this.bg.height=e,this._boundsDirty=!0}getBounds(){return{x:this.x,y:this.y,width:this.width,height:this.height}}draw(){super.draw(),this.group.render()}}class rs extends Vi{constructor(t,e={}){const i=e.onClick;super(t,{...e,onClick:()=>{this.toggled=!this.toggled,typeof e.onToggle=="function"&&e.onToggle(this.toggled),typeof i=="function"&&i(),this.refreshToggleVisual()}}),this.colorActiveBg=e.colorActiveBg||pt.button.active.bg,this.colorActiveStroke=e.colorActiveStroke||pt.button.active.stroke,this.colorActiveText=e.colorActiveText||pt.button.active.text,this.toggled=!!e.startToggled,this.refreshToggleVisual()}toggle(t){this.toggled=t,this.refreshToggleVisual()}refreshToggleVisual(){this.toggled?(this.bg.fillColor=this.colorActiveBg,this.bg.strokeColor=this.colorActiveStroke,this.label.color=this.colorActiveText):(this.bg.fillColor=this.colors.default.bg,this.bg.strokeColor=this.colors.default.stroke,this.label.color=this.colors.default.text)}setState(t){super.setState(t),this.toggled&&(this.bg.fillColor=this.colorActiveBg,this.bg.strokeColor=this.colorActiveStroke,this.label.color=this.colorActiveText)}}class $i{constructor(){this.x=0,this.y=0,this.z=0,this.vx=0,this.vy=0,this.vz=0,this.size=1,this.color={r:255,g:255,b:255,a:1},this.shape="circle",this.age=0,this.lifetime=1,this.alive=!0,this.custom={}}reset(){this.x=0,this.y=0,this.z=0,this.vx=0,this.vy=0,this.vz=0,this.size=1,this.color.r=255,this.color.g=255,this.color.b=255,this.color.a=1,this.shape="circle",this.age=0,this.lifetime=1,this.alive=!0;for(const t in this.custom)delete this.custom[t]}get progress(){return this.lifetime>0?this.age/this.lifetime:1}}class as{constructor(t={}){this.rate=t.rate??10,this.position={x:0,y:0,z:0,...t.position},this.spread={x:0,y:0,z:0,...t.spread},this.velocity={x:0,y:0,z:0,...t.velocity},this.velocitySpread={x:0,y:0,z:0,...t.velocitySpread},this.lifetime={min:1,max:2,...t.lifetime},this.size={min:1,max:1,...t.size},this.color={r:255,g:255,b:255,a:1,...t.color},this.shape=t.shape??"circle",this.active=t.active!==!1,this._timer=0}_spread(t){return(Math.random()-.5)*2*t}_range(t,e){return t+Math.random()*(e-t)}emit(t){t.x=this.position.x+this._spread(this.spread.x),t.y=this.position.y+this._spread(this.spread.y),t.z=this.position.z+this._spread(this.spread.z),t.vx=this.velocity.x+this._spread(this.velocitySpread.x),t.vy=this.velocity.y+this._spread(this.velocitySpread.y),t.vz=this.velocity.z+this._spread(this.velocitySpread.z),t.lifetime=this._range(this.lifetime.min,this.lifetime.max),t.age=0,t.alive=!0,t.size=this._range(this.size.min,this.size.max),t.color.r=this.color.r,t.color.g=this.color.g,t.color.b=this.color.b,t.color.a=this.color.a,t.shape=this.shape}update(t){if(!this.active||this.rate<=0)return 0;this._timer+=t;const e=1/this.rate;let i=0;for(;this._timer>=e;)this._timer-=e,i++;return i}reset(){this._timer=0}}const Xe={velocity:(f,t)=>{f.x+=f.vx*t,f.y+=f.vy*t,f.z+=f.vz*t},lifetime:(f,t)=>{f.age+=t,f.age>=f.lifetime&&(f.alive=!1)},gravity:(f=200)=>(t,e)=>{t.vy+=f*e},rise:(f=100)=>(t,e)=>{t.vy-=f*e},damping:(f=.98)=>(t,e)=>{t.vx*=f,t.vy*=f,t.vz*=f},fadeOut:(f,t)=>{f.color.a=Math.max(0,1-f.progress)},fadeInOut:(f,t)=>{const e=f.progress;f.color.a=e<.5?e*2:(1-e)*2},shrink:(f=0)=>(t,e)=>{t.custom._initialSize===void 0&&(t.custom._initialSize=t.size),t.size=t.custom._initialSize*(1-t.progress*(1-f))},grow:(f=2)=>(t,e)=>{t.custom._initialSize===void 0&&(t.custom._initialSize=t.size),t.size=t.custom._initialSize*(1+t.progress*(f-1))},colorOverLife:(f,t)=>(e,i)=>{const s=e.progress;e.color.r=Math.floor(f.r+(t.r-f.r)*s),e.color.g=Math.floor(f.g+(t.g-f.g)*s),e.color.b=Math.floor(f.b+(t.b-f.b)*s)},wobble:(f=10)=>(t,e)=>{t.vx+=(Math.random()-.5)*f*e,t.vy+=(Math.random()-.5)*f*e},bounds:(f,t=.8)=>(e,i)=>{e.x<f.left?(e.x=f.left,e.vx=Math.abs(e.vx)*t):e.x>f.right&&(e.x=f.right,e.vx=-Math.abs(e.vx)*t),e.y<f.top?(e.y=f.top,e.vy=Math.abs(e.vy)*t):e.y>f.bottom&&(e.y=f.bottom,e.vy=-Math.abs(e.vy)*t)},attract:(f,t=100)=>(e,i)=>{const s=f.x-e.x,n=f.y-e.y,r=(f.z??0)-e.z,o=Math.sqrt(s*s+n*n+r*r);if(o>1){const a=t*i/o;e.vx+=s*a,e.vy+=n*a,e.vz+=r*a}}};class ls extends Vt{constructor(t,e={}){super(t,e),this.particles=[],this.pool=[],this.maxParticles=e.maxParticles??5e3,this.emitters=new Map,this.camera=e.camera??null,this.depthSort=e.depthSort??!1,this.updaters=e.updaters??[Xe.velocity,Xe.lifetime],this.blendMode=e.blendMode??"source-over",this.worldSpace=e.worldSpace??!1,this._particleCount=0}addEmitter(t,e){return this.emitters.set(t,e),this}removeEmitter(t){return this.emitters.delete(t),this}getEmitter(t){return this.emitters.get(t)}acquire(){return this.pool.length>0?this.pool.pop():new $i}release(t){t.reset(),this.pool.push(t)}emit(t,e){for(let i=0;i<t&&this.particles.length<this.maxParticles;i++){const s=this.acquire();e.emit(s),this.particles.push(s)}}burst(t,e){const i=typeof e=="string"?this.emitters.get(e):e;i&&this.emit(t,i)}update(t){super.update(t);for(const e of this.emitters.values())if(e.active){const i=e.update(t);this.emit(i,e)}for(let e=this.particles.length-1;e>=0;e--){const i=this.particles[e];for(const s of this.updaters)s(i,t,this);i.alive||(this.release(i),this.particles.splice(e,1))}this._particleCount=this.particles.length}render(){super.render(),this.particles.length!==0&&(this.camera&&this.depthSort?this.renderWithDepthSort():this.renderSimple())}renderSimple(){v.useCtx(t=>{t.globalCompositeOperation=this.blendMode;for(const e of this.particles)this.drawParticle(t,e,e.x,e.y,1);t.globalCompositeOperation="source-over"})}renderWithDepthSort(){const t=[];for(const e of this.particles){const i=this.camera.project(e.x,e.y,e.z);i.z<-this.camera.perspective+10||t.push({p:e,x:i.x,y:i.y,z:i.z,scale:i.scale})}t.sort((e,i)=>i.z-e.z),v.useCtx(e=>{e.globalCompositeOperation=this.blendMode;const i=this.parent&&this.parent.constructor.name==="Scene3D";!this.worldSpace&&!i&&(e.save(),e.translate(this.game.width/2,this.game.height/2));for(const s of t)this.drawParticle(e,s.p,s.x,s.y,s.scale);!this.worldSpace&&!i&&e.restore(),e.globalCompositeOperation="source-over"})}drawParticle(t,e,i,s,n){const{r,g:o,b:a,a:l}=e.color,c=e.size*n;if(c<.5||l<=0)return;t.fillStyle=`rgba(${Math.floor(r)},${Math.floor(o)},${Math.floor(a)},${l})`;const u=e.shape??"circle",h=c/2;t.beginPath(),u==="circle"?t.arc(i,s,h,0,Math.PI*2):u==="square"?t.rect(i-h,s-h,c,c):u==="triangle"&&(t.moveTo(i,s-h),t.lineTo(i+h,s+h),t.lineTo(i-h,s+h),t.closePath()),t.fill()}clear(){for(const t of this.particles)this.release(t);this.particles=[],this._particleCount=0}get particleCount(){return this._particleCount}get poolSize(){return this.pool.length}}class qe{static applyADSR(t,e={}){const{attack:i=.01,decay:s=.1,sustain:n=.7,release:r=.2,startTime:o=0,duration:a=1,peakVolume:l=1}=e,c=l*n,u=Math.max(0,a-i-s);t.setValueAtTime(0,o),t.linearRampToValueAtTime(l,o+i),t.linearRampToValueAtTime(c,o+i+s),t.setValueAtTime(c,o+i+s+u),t.linearRampToValueAtTime(0,o+a+r)}static get presets(){return{pluck:{attack:.001,decay:.2,sustain:0,release:.1},pad:{attack:.5,decay:.3,sustain:.8,release:1},organ:{attack:.01,decay:0,sustain:1,release:.05},perc:{attack:.001,decay:.1,sustain:0,release:.05},string:{attack:.1,decay:.2,sustain:.7,release:.3},brass:{attack:.05,decay:.1,sustain:.8,release:.2},blip:{attack:.001,decay:.05,sustain:0,release:.02},laser:{attack:.001,decay:.15,sustain:0,release:.05},explosion:{attack:.001,decay:.3,sustain:.2,release:.5}}}}class fe{static init(t,e){N(this,L,t),N(this,zt,e)}static get ctx(){return _(this,L)}static get now(){return _(this,L).currentTime}static tone(t,e,i={}){const{type:s="sine",volume:n=.5,attack:r=.01,decay:o=.1,sustain:a=.7,release:l=.2,detune:c=0,startTime:u=_(this,L).currentTime}=i,h=_(this,L).createOscillator(),d=_(this,L).createGain();return h.type=s,h.frequency.setValueAtTime(t,u),h.detune.setValueAtTime(c,u),qe.applyADSR(d.gain,{attack:r,decay:o,sustain:a,release:l,startTime:u,duration:e,peakVolume:n}),h.connect(d),d.connect(_(this,zt)),h.start(u),h.stop(u+e+l),h}static continuous(t={}){const{type:e="sine",frequency:i=440,volume:s=.5}=t,n=_(this,L).createOscillator(),r=_(this,L).createGain();n.type=e,n.frequency.value=i,r.gain.value=s,n.connect(r),r.connect(_(this,zt)),n.start();const o=_(this,L);return{osc:n,gain:r,setFrequency:(a,l=0)=>{l>0?n.frequency.linearRampToValueAtTime(a,o.currentTime+l):n.frequency.setValueAtTime(a,o.currentTime)},setVolume:(a,l=0)=>{l>0?r.gain.linearRampToValueAtTime(a,o.currentTime+l):r.gain.setValueAtTime(a,o.currentTime)},stop:(a=0)=>{a>0?(r.gain.linearRampToValueAtTime(0,o.currentTime+a),n.stop(o.currentTime+a+.01)):n.stop()}}}static fm(t,e,i,s,n={}){const{volume:r=.5,startTime:o=_(this,L).currentTime}=n,a=_(this,L).createOscillator(),l=_(this,L).createOscillator(),c=_(this,L).createGain(),u=_(this,L).createGain();return l.frequency.value=e,c.gain.value=i,a.frequency.value=t,u.gain.value=r,l.connect(c),c.connect(a.frequency),a.connect(u),u.connect(_(this,zt)),u.gain.setValueAtTime(r,o),u.gain.linearRampToValueAtTime(0,o+s),l.start(o),a.start(o),l.stop(o+s+.1),a.stop(o+s+.1),{carrier:a,modulator:l,outputGain:u}}static additive(t,e,i,s={}){const{volume:n=.5,startTime:r=_(this,L).currentTime}=s,o=[],a=_(this,L).createGain();return a.gain.value=n/e.length,a.connect(_(this,zt)),a.gain.setValueAtTime(n/e.length,r),a.gain.linearRampToValueAtTime(0,r+i),e.forEach((l,c)=>{if(l>0){const u=_(this,L).createOscillator(),h=_(this,L).createGain();u.frequency.value=t*(c+1),h.gain.value=l,u.connect(h),h.connect(a),u.start(r),u.stop(r+i+.1),o.push(u)}}),o}static sweep(t,e,i,s={}){const{type:n="sine",volume:r=.5,exponential:o=!0,startTime:a=_(this,L).currentTime}=s,l=_(this,L).createOscillator(),c=_(this,L).createGain();return l.type=n,l.frequency.setValueAtTime(t,a),o&&e>0?l.frequency.exponentialRampToValueAtTime(e,a+i):l.frequency.linearRampToValueAtTime(e,a+i),c.gain.setValueAtTime(r,a),c.gain.linearRampToValueAtTime(0,a+i),l.connect(c),c.connect(_(this,zt)),l.start(a),l.stop(a+i+.01),l}static pulse(t,e,i=.5,s={}){const{volume:n=.5,startTime:r=_(this,L).currentTime}=s,o=_(this,L).createOscillator(),a=_(this,L).createOscillator(),l=_(this,L).createGain(),c=_(this,L).createGain(),u=_(this,L).createGain();return o.type="sawtooth",a.type="sawtooth",o.frequency.value=t,a.frequency.value=t,l.gain.value=.5,c.gain.value=-.5,u.gain.setValueAtTime(n,r),u.gain.linearRampToValueAtTime(0,r+e),o.connect(l),a.connect(c),l.connect(u),c.connect(u),u.connect(_(this,zt)),o.start(r),a.start(r),o.stop(r+e+.01),a.stop(r+e+.01),{osc1:o,osc2:a,output:u}}}L=new WeakMap;zt=new WeakMap;Y(fe,L,null);Y(fe,zt,null);class de{static init(t,e){N(this,G,t),N(this,Ce,e)}static get ctx(){return _(this,G)}static filter(t="lowpass",e=1e3,i=1){const s=_(this,G).createBiquadFilter();return s.type=t,s.frequency.value=e,s.Q.value=i,s}static delay(t=.3,e=.4,i=.5){const s=_(this,G).createDelay(5),n=_(this,G).createGain(),r=_(this,G).createGain(),o=_(this,G).createGain(),a=_(this,G).createGain(),l=_(this,G).createGain();return s.delayTime.value=t,n.gain.value=e,r.gain.value=i,o.gain.value=1-i,a.connect(s),a.connect(o),s.connect(n),n.connect(s),s.connect(r),r.connect(l),o.connect(l),{input:a,output:l,setTime:c=>s.delayTime.setValueAtTime(c,_(this,G).currentTime),setFeedback:c=>n.gain.setValueAtTime(c,_(this,G).currentTime),setMix:c=>{r.gain.setValueAtTime(c,_(this,G).currentTime),o.gain.setValueAtTime(1-c,_(this,G).currentTime)}}}static reverb(t=2,e=2){const i=_(this,G).createConvolver(),s=_(this,G).sampleRate,n=s*t,r=_(this,G).createBuffer(2,n,s);for(let o=0;o<2;o++){const a=r.getChannelData(o);for(let l=0;l<n;l++)a[l]=(Math.random()*2-1)*Math.pow(1-l/n,e)}return i.buffer=r,i}static distortion(t=50){const e=_(this,G).createWaveShaper(),i=t,s=44100,n=new Float32Array(s);for(let r=0;r<s;r++){const o=r*2/s-1;n[r]=(3+i)*o*20*(Math.PI/180)/(Math.PI+i*Math.abs(o))}return e.curve=n,e.oversample="4x",e}static tremolo(t=5,e=.5){const i=_(this,G).createOscillator(),s=_(this,G).createGain(),n=_(this,G).createGain();return i.frequency.value=t,s.gain.value=e*.5,n.gain.value=1-e*.5,i.connect(s),s.connect(n.gain),i.start(),{input:n,output:n,lfo:i,setRate:r=>i.frequency.setValueAtTime(r,_(this,G).currentTime),setDepth:r=>s.gain.setValueAtTime(r*.5,_(this,G).currentTime),stop:()=>i.stop()}}static compressor(t={}){const{threshold:e=-24,knee:i=30,ratio:s=12,attack:n=.003,release:r=.25}=t,o=_(this,G).createDynamicsCompressor();return o.threshold.value=e,o.knee.value=i,o.ratio.value=s,o.attack.value=n,o.release.value=r,o}static panner(t=0){const e=_(this,G).createStereoPanner();return e.pan.value=t,e}static gain(t=1){const e=_(this,G).createGain();return e.gain.value=t,e}}G=new WeakMap;Ce=new WeakMap;Y(de,G,null);Y(de,Ce,null);class ji{static white(t,e){const i=t.sampleRate*e,s=t.createBuffer(1,i,t.sampleRate),n=s.getChannelData(0);for(let o=0;o<i;o++)n[o]=Math.random()*2-1;const r=t.createBufferSource();return r.buffer=s,r}static pink(t,e){const i=t.sampleRate*e,s=t.createBuffer(1,i,t.sampleRate),n=s.getChannelData(0);let r=0,o=0,a=0,l=0,c=0,u=0,h=0;for(let m=0;m<i;m++){const g=Math.random()*2-1;r=.99886*r+g*.0555179,o=.99332*o+g*.0750759,a=.969*a+g*.153852,l=.8665*l+g*.3104856,c=.55*c+g*.5329522,u=-.7616*u-g*.016898,n[m]=(r+o+a+l+c+u+h+g*.5362)*.11,h=g*.115926}const d=t.createBufferSource();return d.buffer=s,d}static brown(t,e){const i=t.sampleRate*e,s=t.createBuffer(1,i,t.sampleRate),n=s.getChannelData(0);let r=0;for(let a=0;a<i;a++){const l=Math.random()*2-1;n[a]=(r+.02*l)/1.02,r=n[a],n[a]*=3.5}const o=t.createBufferSource();return o.buffer=s,o}}class pe{static noteToFreq(t){const e=t.match(/^([A-G][#b]?)(\d+)$/);if(!e)throw new Error(`Invalid note: ${t}`);const[,i,s]=e,n=this.NOTE_FREQUENCIES[i];if(n===void 0)throw new Error(`Unknown note: ${i}`);return n*Math.pow(2,parseInt(s))}static scale(t,e="major",i=1){const s=this.noteToFreq(t),n=this.SCALES[e];if(!n)throw new Error(`Unknown scale: ${e}`);const r=[];for(let o=0;o<i;o++)for(const a of n)r.push(s*Math.pow(2,(a+o*12)/12));return r}static chord(t,e="major"){const i=this.noteToFreq(t),s=this.CHORDS[e];if(!s)throw new Error(`Unknown chord type: ${e}`);return s.map(n=>i*Math.pow(2,n/12))}static mapToScale(t,e="C4",i="pentatonic",s=2){const n=this.scale(e,i,s),r=Math.max(0,Math.min(1,t)),o=Math.floor(r*n.length)%n.length;return n[o]}static midiToFreq(t){return 440*Math.pow(2,(t-69)/12)}static freqToMidi(t){return Math.round(12*Math.log2(t/440)+69)}static randomNote(t="C4",e="pentatonic",i=2){const s=this.scale(t,e,i);return s[Math.floor(Math.random()*s.length)]}static detune(t,e){return t*Math.pow(2,e/1200)}}E(pe,"NOTE_FREQUENCIES",{C:16.35,"C#":17.32,Db:17.32,D:18.35,"D#":19.45,Eb:19.45,E:20.6,F:21.83,"F#":23.12,Gb:23.12,G:24.5,"G#":25.96,Ab:25.96,A:27.5,"A#":29.14,Bb:29.14,B:30.87});E(pe,"SCALES",{major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],pentatonic:[0,2,4,7,9],pentatonicMinor:[0,3,5,7,10],blues:[0,3,5,6,7,10],dorian:[0,2,3,5,7,9,10],mixolydian:[0,2,4,5,7,9,10],chromatic:[0,1,2,3,4,5,6,7,8,9,10,11],wholeTone:[0,2,4,6,8,10],diminished:[0,2,3,5,6,8,9,11]});E(pe,"CHORDS",{major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8],sus2:[0,2,7],sus4:[0,5,7],major7:[0,4,7,11],minor7:[0,3,7,10],dom7:[0,4,7,10],dim7:[0,3,6,9],add9:[0,4,7,14],power:[0,7]});class Ut{static init(t,e){N(this,ne,t),N(this,$,t.createAnalyser()),_(this,$).fftSize=2048,e.connect(_(this,$)),_(this,$).connect(t.destination),N(this,Wt,new Uint8Array(_(this,$).frequencyBinCount)),N(this,Gt,new Uint8Array(_(this,$).frequencyBinCount))}static get isInitialized(){return _(this,$)!==null}static get node(){return _(this,$)}static setFFTSize(t){_(this,$)&&(_(this,$).fftSize=t,N(this,Wt,new Uint8Array(_(this,$).frequencyBinCount)),N(this,Gt,new Uint8Array(_(this,$).frequencyBinCount)))}static getWaveform(){return _(this,$)?(_(this,$).getByteTimeDomainData(_(this,Wt)),_(this,Wt)):new Uint8Array(0)}static getFrequency(){return _(this,$)?(_(this,$).getByteFrequencyData(_(this,Gt)),_(this,Gt)):new Uint8Array(0)}static getBands(t=8){const e=this.getFrequency();if(e.length===0)return new Array(t).fill(0);const i=Math.floor(e.length/t),s=[];for(let n=0;n<t;n++){let r=0;for(let o=0;o<i;o++)r+=e[n*i+o];s.push(r/(i*255))}return s}static getAmplitude(){const t=this.getWaveform();if(t.length===0)return 0;let e=0;for(let i=0;i<t.length;i++){const s=(t[i]-128)/128;e+=s*s}return Math.sqrt(e/t.length)}static getPeakFrequency(){if(!_(this,$)||!_(this,ne))return 0;const t=this.getFrequency();let e=0,i=0;for(let n=0;n<t.length;n++)t[n]>i&&(i=t[n],e=n);const s=_(this,ne).sampleRate/2;return e*s/_(this,$).frequencyBinCount}static dispose(){_(this,$)&&(_(this,$).disconnect(),N(this,$,null)),N(this,Wt,null),N(this,Gt,null)}}ne=new WeakMap;$=new WeakMap;Wt=new WeakMap;Gt=new WeakMap;Y(Ut,ne,null);Y(Ut,$,null);Y(Ut,Wt,null);Y(Ut,Gt,null);class Ae{static init(t={}){if(_(this,Zt)){console.warn("[Synth] Already initialized");return}const{masterVolume:e=.5,sampleRate:i=44100,enableAnalyzer:s=!1}=t;try{N(this,j,new(window.AudioContext||window.webkitAudioContext)({sampleRate:i})),N(this,ht,_(this,j).createGain()),_(this,ht).gain.value=e,_(this,ht).connect(_(this,j).destination),fe.init(_(this,j),_(this,ht)),de.init(_(this,j),_(this,ht)),s&&Ut.init(_(this,j),_(this,ht)),N(this,Zt,!0),console.log("[Synth] Audio system initialized")}catch(n){console.error("[Synth] Failed to initialize audio:",n)}}static get isInitialized(){return _(this,Zt)}static get ctx(){return _(this,j)}static get master(){return _(this,ht)}static get osc(){return fe}static get fx(){return de}static get env(){return qe}static get noise(){return ji}static get music(){return pe}static get analyzer(){return Ut}static async resume(){_(this,j)&&_(this,j).state==="suspended"&&(await _(this,j).resume(),console.log("[Synth] Audio context resumed"))}static async suspend(){_(this,j)&&_(this,j).state==="running"&&await _(this,j).suspend()}static get now(){return _(this,j)?_(this,j).currentTime:0}static get state(){return _(this,j)?_(this,j).state:"closed"}static set volume(t){_(this,ht)&&_(this,ht).gain.setValueAtTime(Math.max(0,Math.min(1,t)),_(this,j).currentTime)}static get volume(){return _(this,ht)?_(this,ht).gain.value:0}static chain(...t){for(let e=0;e<t.length-1;e++)t[e].connect(t[e+1]);return{first:t[0],last:t[t.length-1],connectTo:e=>t[t.length-1].connect(e)}}static schedule(t,e){const i=Math.max(0,(e-this.now)*1e3);return setTimeout(t,i)}static async close(){_(this,j)&&(Ut.dispose(),await _(this,j).close(),N(this,j,null),N(this,ht,null),N(this,Zt,!1),console.log("[Synth] Audio system closed"))}}j=new WeakMap;ht=new WeakMap;Zt=new WeakMap;Y(Ae,j,null);Y(Ae,ht,null);Y(Ae,Zt,!1);export{jt as B,Ki as C,Et as E,Oe as F,ns as G,os as I,W as M,_t as N,v as P,He as S,rs as T,Xe as U,Qi as a,as as b,ls as c,Ai as d,is as e,De as f,ss as h,es as t,ts as z};
