import{G as w,P as S,B,p as P,I,E as W}from"./index-B0ivFyqO.js";const h={background:"#000",borderColor:"#0f0",borderWidth:3,boxPadding:20,boxGap:40,buttonWidth:220,buttonHeight:50,buttonY:50,maxImageSize:800,pixelSampleStep:4,pixelSize:4,flightDuration:.4,flightStagger:3e-4,trailAlpha:.15,colorPreservation:.7,processResolution:128,layerOpacity:.6};class D extends P{constructor(t,e={}){super(t,{x:e.x??0,y:e.y??0,width:e.size??200,height:e.size??200}),this.visible=!0,this.active=!0,this.boxSize=e.size??200,this.labelText=e.label??"",this.image=null}setImage(t,e,s){this.image&&this.remove(this.image),this.image=new I(this.game,t,{x:this.x,y:this.y,width:e,height:s,anchor:"center"}),this.add(this.image),this.labelText=""}clearImage(){this.image&&(this.remove(this.image),this.image=null)}render(){if(!this.visible)return;const t=this.game.ctx;t.save(),t.strokeStyle=h.borderColor,t.lineWidth=h.borderWidth,t.strokeRect(this.x-this.boxSize/2,this.y-this.boxSize/2,this.boxSize,this.boxSize),this.labelText&&(t.fillStyle=h.borderColor,t.font="16px monospace",t.textAlign="center",t.textBaseline="middle",t.fillText(this.labelText,this.x,this.y)),t.restore(),this.image&&this.image.visible!==!1&&this.image.render()}setImageVisible(t){this.image&&(this.image.visible=t)}}class z{constructor(t,e,s,a,o,r,i,n=1){this.sx=t,this.sy=e,this.tx=s,this.ty=a,this.x=t,this.y=e,this.color=o,this.delay=r,this.time=0,this.arrived=!1,this.spawned=!1,this.layerOpacity=n,this.alpha=n,this.sourcePixelInfo=i,this.r=0,this.g=0,this.b=0,this._parseColor(o)}_parseColor(t){const e=t.match(/rgb\((\d+),(\d+),(\d+)\)/);e&&(this.r=parseInt(e[1]),this.g=parseInt(e[2]),this.b=parseInt(e[3]))}update(t){if(this.arrived||(this.time+=t,this.time<this.delay))return;this.spawned||(this.spawned=!0);const e=this.time-this.delay,s=Math.min(e/h.flightDuration,1),a=W.easeOutExpo(s);this.x=this.sx+(this.tx-this.sx)*a,this.y=this.sy+(this.ty-this.sy)*a,this.alpha=Math.min(this.layerOpacity,s*2*this.layerOpacity),s>=1&&(this.arrived=!0,this.x=this.tx,this.y=this.ty)}render(t){this.time<this.delay||(t.globalAlpha=this.alpha,t.fillStyle=this.color,t.fillRect(this.x-h.pixelSize/2,this.y-h.pixelSize/2,h.pixelSize,h.pixelSize))}}function k(){const b=`
    // Perceptual luminance
    function getLuminance(r, g, b) {
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Build luminance-based color map
    function buildColorMap(sourceData, width, height) {
      const map = new Map();
      const bucketSize = 8;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = sourceData[i];
          const g = sourceData[i + 1];
          const b = sourceData[i + 2];
          const a = sourceData[i + 3];

          if (a < 10) continue;

          const lum = getLuminance(r, g, b);
          const lumBucket = Math.floor(lum / bucketSize);

          const lumKey = 'L' + lumBucket;
          if (!map.has(lumKey)) {
            map.set(lumKey, []);
          }
          map.get(lumKey).push({ r, g, b, x, y, lum });
        }
      }
      return map;
    }

    // Find matching pixel with color preservation
    // colorPreservation: 0 = exact match, 1 = random from luminance bracket
    function findBestMatch(targetR, targetG, targetB, colorMap, sourceData, sourceWidth, sourceHeight, colorPreservation) {
      const targetLum = getLuminance(targetR, targetG, targetB);
      const lumBucketSize = 8;
      const lumBucket = Math.floor(targetLum / lumBucketSize);

      // Collect all candidates within luminance range
      const goodCandidates = [];
      const lumTolerance = 15;  // Accept pixels within this luminance difference

      for (let dl = -2; dl <= 2; dl++) {
        const lumKey = 'L' + (lumBucket + dl);
        const candidates = colorMap.get(lumKey);

        if (!candidates) continue;

        for (const candidate of candidates) {
          const lumDiff = Math.abs(targetLum - candidate.lum);
          if (lumDiff <= lumTolerance) {
            // Score for sorting (lower = better match)
            const colorDiff = Math.sqrt(
              (targetR - candidate.r) ** 2 +
              (targetG - candidate.g) ** 2 +
              (targetB - candidate.b) ** 2
            );
            goodCandidates.push({ ...candidate, score: lumDiff * 2 + colorDiff });
          }
        }
      }

      if (goodCandidates.length === 0) {
        // Fallback: random pixel from source
        const x = Math.floor(Math.random() * sourceWidth);
        const y = Math.floor(Math.random() * sourceHeight);
        const i = (y * sourceWidth + x) * 4;
        return {
          r: sourceData[i], g: sourceData[i + 1], b: sourceData[i + 2],
          x, y,
          lum: getLuminance(sourceData[i], sourceData[i + 1], sourceData[i + 2])
        };
      }

      // Sort by score (best matches first)
      goodCandidates.sort((a, b) => a.score - b.score);

      // Color preservation determines how deep into the candidate pool we pick
      // 0 = always best, 1 = random from all good matches
      const poolSize = Math.max(1, Math.floor(goodCandidates.length * colorPreservation));
      const randomIndex = Math.floor(Math.random() * poolSize);

      return goodCandidates[randomIndex];
    }

    // Main message handler
    self.onmessage = function(e) {
      const { avatarData, avatarWidth, avatarHeight, sourceData, sourceWidth, sourceHeight, step, displayWidth, displayHeight, colorPreservation } = e.data;

      // Build color map
      self.postMessage({ type: 'progress', stage: 'Building color map...', percent: 0 });
      const colorMap = buildColorMap(sourceData, sourceWidth, sourceHeight);

      // Process avatar pixels
      const pixelData = [];
      let totalPixels = 0;

      // Count total first
      for (let ty = 0; ty < avatarHeight; ty += step) {
        for (let tx = 0; tx < avatarWidth; tx += step) {
          const idx = (ty * avatarWidth + tx) * 4;
          if (avatarData[idx + 3] >= 10) totalPixels++;
        }
      }

      let processed = 0;
      let lastProgress = 0;

      for (let ty = 0; ty < avatarHeight; ty += step) {
        for (let tx = 0; tx < avatarWidth; tx += step) {
          const idx = (ty * avatarWidth + tx) * 4;
          const r = avatarData[idx];
          const g = avatarData[idx + 1];
          const b = avatarData[idx + 2];
          const a = avatarData[idx + 3];

          if (a < 10) continue;

          const match = findBestMatch(r, g, b, colorMap, sourceData, sourceWidth, sourceHeight, colorPreservation);

          const sourceX = (match.x / sourceWidth) * displayWidth;
          const sourceY = (match.y / sourceHeight) * displayHeight;

          pixelData.push({
            sourceX, sourceY,
            targetX: tx, targetY: ty,
            r: match.r, g: match.g, b: match.b,
            displaySourceX: Math.floor(sourceX),
            displaySourceY: Math.floor(sourceY),
          });

          processed++;
          const progress = Math.floor((processed / totalPixels) * 100);
          if (progress > lastProgress) {
            lastProgress = progress;
            self.postMessage({ type: 'progress', stage: 'Matching pixels...', percent: progress });
          }
        }
      }

      // Shuffle
      for (let i = pixelData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pixelData[i], pixelData[j]] = [pixelData[j], pixelData[i]];
      }

      self.postMessage({ type: 'complete', pixelData });
    };
  `,t=new Blob([b],{type:"application/javascript"});return new Worker(URL.createObjectURL(t))}class H extends w{constructor(t){super(t),this.backgroundColor=h.background}init(){super.init(),S.init(this.ctx);const t=this.width-h.boxPadding*2,e=Math.min(t-h.boxGap,(this.height-h.boxPadding*2-h.buttonHeight-h.buttonY)*2-h.boxGap),s=Math.floor((e-h.boxGap)/2);this.boxSize=s;const a=s*2+h.boxGap,o=(this.width-a)/2,r=o+s/2,i=o+s+h.boxGap+s/2,n=this.height/2;this.leftBoxX=r,this.rightBoxX=i,this.boxCenterY=n,this.leftBox=new D(this,{x:r,y:n,size:s,label:"Drop Image Here"}),this.pipeline.add(this.leftBox),this.rightBox=new D(this,{x:i,y:n,size:s,label:"?"}),this.pipeline.add(this.rightBox),this.loadAvatarData(),this.createTransformButton(),this.setupDragAndDrop(),this.uploadedImageData=null,this.avatarImageData=null,this.flyingPixels=[],this.isAnimating=!1,this.isProcessing=!1,this.landedPixels=[],this.resultCanvas=null,this.resultCtx=null,this.layerCount=0}async loadAvatarData(){try{const t=new Image;t.crossOrigin="anonymous",await new Promise((i,n)=>{t.onload=i,t.onerror=n,t.src="/avatar.jpeg"});const e=Math.min(this.boxSize/t.width,this.boxSize/t.height),s=Math.floor(t.width*e),a=Math.floor(t.height*e),o=document.createElement("canvas");o.width=s,o.height=a;const r=o.getContext("2d");r.drawImage(t,0,0,s,a),this.avatarImageData=r.getImageData(0,0,s,a),this.avatarWidth=s,this.avatarHeight=a,console.log("[Day13] Avatar data loaded secretly:",s,"x",a)}catch(t){console.error("[Day13] Failed to load avatar:",t)}}createTransformButton(){this.transformButton=new B(this,{x:this.width/2,y:h.buttonY,width:h.buttonWidth,height:h.buttonHeight,text:"Transform",onClick:()=>this.startTransform()}),this.pipeline.add(this.transformButton)}setupDragAndDrop(){["dragenter","dragover","dragleave","drop"].forEach(t=>{this.canvas.addEventListener(t,e=>{e.preventDefault(),e.stopPropagation()},!1)}),this.canvas.addEventListener("drop",async t=>{const e=t.dataTransfer.files;e.length>0&&e[0].type.startsWith("image/")&&await this.loadUploadedImage(e[0])}),this.isPickingFile=!1,this.canvas.addEventListener("click",async t=>{if(this.isAnimating||this.isProcessing||this.isPickingFile||this.processImageData)return;const e=this.canvas.getBoundingClientRect(),s=t.clientX-e.left,a=t.clientY-e.top,o=this.leftBox.x-this.boxSize/2,r=this.leftBox.y-this.boxSize/2;if(s>=o&&s<=o+this.boxSize&&a>=r&&a<=r+this.boxSize){this.isPickingFile=!0;const i=document.createElement("input");i.type="file",i.accept="image/*",i.onchange=async n=>{n.target.files.length>0&&await this.loadUploadedImage(n.target.files[0]),this.isPickingFile=!1},i.addEventListener("cancel",()=>{this.isPickingFile=!1}),setTimeout(()=>{this.isPickingFile=!1},1e4),i.click()}})}async loadUploadedImage(t){try{const e=new Image;await new Promise((y,m)=>{e.onload=y,e.onerror=m,e.src=URL.createObjectURL(t)});const a=this.boxSize-10*2,o=Math.min(a/e.width,a/e.height),r=Math.floor(e.width*o),i=Math.floor(e.height*o),n=document.createElement("canvas");n.width=r,n.height=i;const g=n.getContext("2d");g.drawImage(e,0,0,r,i);const d=g.getImageData(0,0,r,i);this.displayWidth=r,this.displayHeight=i,this.leftBox.setImage(d,r,i);const u=h.processResolution,c=Math.min(u/e.width,u/e.height,1),l=Math.floor(e.width*c),f=Math.floor(e.height*c),p=document.createElement("canvas");p.width=l,p.height=f;const x=p.getContext("2d");x.drawImage(e,0,0,l,f),this.processImageData=x.getImageData(0,0,l,f),this.processWidth=l,this.processHeight=f,console.log(`[Day13] Display: ${r}x${i}, Process: ${l}x${f}`),this.flyingPixels=[],this.landedPixels=[],this.isAnimating=!1,this.rightBox.labelText="?",this.rightBox.clearImage()}catch(e){console.error("[Day13] Failed to load uploaded image:",e)}}startTransform(){if(!this.processImageData||!this.avatarImageData||this.isAnimating||this.isProcessing){console.warn("[Day13] Cannot transform - missing data or already processing");return}this.isProcessing=!0,this.transformButton.label.text="Processing 0%",this.layerCount++,this.currentLayerOpacity=this.layerCount===1?1:h.layerOpacity,this.resultCanvas||(this.resultCanvas=document.createElement("canvas"),this.resultCanvas.width=this.avatarWidth,this.resultCanvas.height=this.avatarHeight,this.resultCtx=this.resultCanvas.getContext("2d")),this.sourceCanvas=document.createElement("canvas"),this.sourceCanvas.width=this.displayWidth,this.sourceCanvas.height=this.displayHeight,this.sourceCtx=this.sourceCanvas.getContext("2d"),this.sourceCtx.drawImage(this.leftBox.image.shape._buffer||this.leftBox.image.shape._bitmap,0,0),this.sourceImageData=this.sourceCtx.getImageData(0,0,this.displayWidth,this.displayHeight);const t=k();t.onmessage=e=>{const{type:s,stage:a,percent:o,pixelData:r}=e.data;s==="progress"?this.transformButton.label.text=`${a} ${o}%`:s==="complete"&&(t.terminate(),this.onMatchingComplete(r))},t.onerror=e=>{console.error("[Day13] Worker error:",e),t.terminate(),this.isProcessing=!1,this.transformButton.label.text="Transform"},t.postMessage({avatarData:Array.from(this.avatarImageData.data),avatarWidth:this.avatarWidth,avatarHeight:this.avatarHeight,sourceData:Array.from(this.processImageData.data),sourceWidth:this.processWidth,sourceHeight:this.processHeight,step:h.pixelSampleStep,displayWidth:this.displayWidth,displayHeight:this.displayHeight,colorPreservation:h.colorPreservation})}onMatchingComplete(t){this.isProcessing=!1,this.isAnimating=!0,this.flyingPixels=[],this.landedPixels=[],this.rightBox.labelText="",this.rightBox.clearImage();const e=this.leftBoxX-this.displayWidth/2,s=this.boxCenterY-this.displayHeight/2,a=this.rightBoxX-this.avatarWidth/2,o=this.boxCenterY-this.avatarHeight/2;for(let r=0;r<t.length;r++){const i=t[r],n=r*h.flightStagger,g=e+i.sourceX,d=s+i.sourceY,u=a+i.targetX,c=o+i.targetY,l=`rgb(${i.r},${i.g},${i.b})`;this.flyingPixels.push(new z(g,d,u,c,l,n,{x:i.displaySourceX,y:i.displaySourceY},this.currentLayerOpacity))}console.log("[Day13] Created",this.flyingPixels.length,"flying pixels (randomized)"),this.transformButton.label.text="Transforming..."}getLuminance(t,e,s){return .2126*t+.7152*e+.0722*s}buildColorMap(t){const e=new Map,s=t.data,a=8;for(let o=0;o<t.height;o++)for(let r=0;r<t.width;r++){const i=(o*t.width+r)*4,n=s[i],g=s[i+1],d=s[i+2];if(s[i+3]<10)continue;const c=this.getLuminance(n,g,d),l=Math.floor(c/a),f=Math.floor(n/32),p=Math.floor(g/32),x=Math.floor(d/32),y=`L${l}`;e.has(y)||e.set(y,[]),e.get(y).push({r:n,g,b:d,x:r,y:o,lum:c});const m=`C${f},${p},${x}`;e.has(m)||e.set(m,[]),e.get(m).push({r:n,g,b:d,x:r,y:o,lum:c})}return e}findBestMatch(t,e,s,a){const o=this.getLuminance(t,e,s),i=Math.floor(o/8);let n=null,g=1/0;for(let d=-2;d<=2;d++){const u=`L${i+d}`,c=a.get(u);if(c)for(const l of c){const f=Math.abs(o-l.lum),p=Math.sqrt((t-l.r)**2+(e-l.g)**2+(s-l.b)**2),x=f*3+p;x<g&&(g=x,n=l)}}if(!n){const d=Math.floor(t/32),u=Math.floor(e/32),c=Math.floor(s/32);for(let l=-1;l<=1;l++)for(let f=-1;f<=1;f++)for(let p=-1;p<=1;p++){const x=`C${d+l},${u+f},${c+p}`,y=a.get(x);if(y)for(const m of y){const C=Math.abs(o-m.lum),M=Math.sqrt((t-m.r)**2+(e-m.g)**2+(s-m.b)**2),v=C*3+M;v<g&&(g=v,n=m)}}}if(!n){const d=Math.floor(Math.random()*this.uploadedWidth),u=Math.floor(Math.random()*this.uploadedHeight),c=(u*this.uploadedWidth+d)*4,l=this.uploadedImageData.data;n={r:l[c],g:l[c+1],b:l[c+2],x:d,y:u,lum:this.getLuminance(l[c],l[c+1],l[c+2])}}return n}update(t){if(super.update(t),!this.isAnimating||this.flyingPixels.length===0)return;let e=!0;const s=h.pixelSampleStep;for(const a of this.flyingPixels){const o=a.spawned;if(a.update(t),!o&&a.spawned&&a.sourcePixelInfo){const r=a.sourcePixelInfo.x,i=a.sourcePixelInfo.y;for(let n=0;n<s;n++)for(let g=0;g<s;g++){const d=r+g,u=i+n;if(d>=0&&d<this.displayWidth&&u>=0&&u<this.displayHeight){const c=(u*this.displayWidth+d)*4;this.sourceImageData.data[c+3]=0}}this.sourceDirty=!0}a.arrived||(e=!1)}this.sourceDirty&&(this.sourceCtx.putImageData(this.sourceImageData,0,0),this.sourceDirty=!1),e&&(this.rasterizePixels(),this.isAnimating=!1,this.transformButton.label.text="Transform",console.log("[Day13] Transform complete! Layer",this.layerCount))}rasterizePixels(){if(!this.resultCanvas||this.flyingPixels.length===0)return;const t=this.rightBoxX-this.avatarWidth/2,e=this.boxCenterY-this.avatarHeight/2;this.resultCtx.globalAlpha=this.currentLayerOpacity;for(const s of this.flyingPixels){const a=s.tx-t,o=s.ty-e;this.resultCtx.fillStyle=s.color,this.resultCtx.fillRect(a-h.pixelSize/2,o-h.pixelSize/2,h.pixelSize,h.pixelSize)}this.resultCtx.globalAlpha=1,this.flyingPixels=[],this.leftBox.clearImage(),this.leftBox.labelText="Drop Image Here",this.processImageData=null,console.log("[Day13] Rasterized layer",this.layerCount,"to result canvas")}render(){const t=this.ctx;if(t.fillStyle=`rgba(0, 0, 0, ${h.trailAlpha})`,t.fillRect(0,0,this.width,this.height),this.isAnimating&&this.leftBox.image&&(this.leftBox.image.visible=!1),super.render(),this.isAnimating&&this.sourceCanvas){const e=this.leftBoxX-this.displayWidth/2,s=this.boxCenterY-this.displayHeight/2;t.drawImage(this.sourceCanvas,e,s)}if(this.resultCanvas&&this.layerCount>0){const e=this.rightBoxX-this.avatarWidth/2+1,s=this.boxCenterY-this.avatarHeight/2+1;t.drawImage(this.resultCanvas,e,s,this.avatarWidth-2,this.avatarHeight-2)}t.save();for(const e of this.flyingPixels)e.render(t);t.globalAlpha=1,t.restore()}}function X(b){const t=new H(b);return t.start(),{stop:()=>t.stop(),game:t}}export{X as default};
