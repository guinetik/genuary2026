const b=["One color, one shape","Twelve principles of animation","Fibonacci forever","Lowres","Write 'Genuary'","Lights on/off","Boolean algebra","A City","Crazy automaton","Polar coordinates","Quine","Boxes only","Self portrait","Everything fits perfectly","Invisible object","Order and disorder","Wallpaper group","Unexpected path","16x16","One line","Bauhaus Poster","Pen plotter ready","Transparency","Perfectionist's nightmare","Organic Geometry","Recursive Grids","Lifeform","No libraries, only HTML","Genetic evolution","It's not a bug, it's a feature","GLSL day"],E=[{name:"xX_CyberPunk_Xx",date:"01/15/06",msg:"OMG this site is SO rad!! Added to my geocities links page! 🌟"},{name:"~*StarGazer*~",date:"01/18/06",msg:"Love the vaporwave aesthetic!! A E S T H E T I C"},{name:"NetNinja2006",date:"01/20/06",msg:"Best viewed in 1024x768 with Winamp playing in the background 🎵"},{name:"PixelQueen",date:"01/22/06",msg:"This reminds me of my Angelfire page! Nostalgia overload!!"},{name:"CodeWarrior",date:"01/25/06",msg:"Finally a site that understands the true meaning of WEB DESIGN"},{name:"NeonDreamer",date:"01/27/06",msg:"The grid... the sun... I am ONE with the V A P O R"},{name:"FlashMaster99",date:"01/28/06",msg:"No Flash?? Still looks amazing! Pure HTML power! 💪"},{name:"RetroGamer2K",date:"01/28/06",msg:"This is what the internet was MEANT to be. Take me back!"},{name:"CSSWizard",date:"01/28/06",msg:"The gradients... the animations... *chef's kiss* 👨‍🍳"},{name:"WebmasterJoe",date:"01/28/06",msg:"Added to my webring! Check out my site too: joes-cool-page.tripod.com"},{name:"DigitalNomad",date:"01/28/06",msg:"Surfing the information superhighway has never looked better! 🏄"},{name:"Y2KSurvivor",date:"01/28/06",msg:"We survived Y2K for THIS. Worth it. 10/10 would visit again."}];class w{constructor(t){this.canvas=t,this.running=!1,this.visitors=Math.floor(Math.random()*9e3)+1e3,this.currentSection="home"}generateStyles(){return`
      @import url('https://fonts.googleapis.com/css2?family=VT323&family=Orbitron:wght@400;700;900&display=swap');
      
      @keyframes vhs-flicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; }
        93% { opacity: 0.8; transform: translateX(2px); }
        94% { opacity: 1; transform: translateX(-1px); }
        95% { opacity: 0.9; }
      }
      @keyframes neon-pulse {
        0%, 100% { 
          text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 80px #ff00ff;
          filter: brightness(1);
        }
        50% { 
          text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;
          filter: brightness(0.9);
        }
      }
      @keyframes cyan-pulse {
        0%, 100% { text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff; }
        50% { text-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff; }
      }
      @keyframes grid-scroll {
        from { transform: perspective(500px) rotateX(60deg) translateY(0); }
        to { transform: perspective(500px) rotateX(60deg) translateY(50px); }
      }
      @keyframes float-shape {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(180deg); }
      }
      @keyframes sun-pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
      }
      @keyframes scanline {
        0% { top: 0; }
        100% { top: 100%; }
      }
      @keyframes marquee-scroll {
        from { transform: translateX(100%); }
        to { transform: translateX(-100%); }
      }
      @keyframes rainbow-border {
        0% { border-color: #ff0080; box-shadow: 0 0 20px #ff0080; }
        25% { border-color: #00ffff; box-shadow: 0 0 20px #00ffff; }
        50% { border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff; }
        75% { border-color: #ffff00; box-shadow: 0 0 20px #ffff00; }
        100% { border-color: #ff0080; box-shadow: 0 0 20px #ff0080; }
      }
      @keyframes chrome-shine {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes blink-cursor {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      @keyframes glitch {
        0%, 90%, 100% { transform: translate(0); filter: none; }
        91% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
        92% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
        93% { transform: translate(-1px, 2px); }
        94% { transform: translate(1px, -2px); filter: hue-rotate(180deg); }
      }
      @keyframes construction-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0.3; }
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes bounce-in {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes typing {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes wave {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-5px); }
        75% { transform: translateY(5px); }
      }
    `}createFloatingShape(t,a){const i=document.createElement("div"),s=30+Math.random()*50,o=Math.random()*100,n=Math.random()*60,e=4+Math.random()*4,r=Math.random()*4;let l="";const f=["#ff0080","#00ffff","#ff00ff","#ffff00","#00ff80"],d=f[a%f.length];return t==="triangle"?l=`
        width: 0; height: 0;
        border-left: ${s/2}px solid transparent;
        border-right: ${s/2}px solid transparent;
        border-bottom: ${s}px solid transparent;
        border-bottom-color: ${d};
        filter: drop-shadow(0 0 10px ${d});
      `:t==="circle"?l=`
        width: ${s}px; height: ${s}px;
        border: 3px solid ${d};
        border-radius: 50%;
        box-shadow: 0 0 20px ${d}, inset 0 0 20px ${d}40;
      `:l=`
        width: ${s}px; height: ${s}px;
        border: 3px solid ${d};
        box-shadow: 0 0 20px ${d};
        transform: rotate(45deg);
      `,i.style.cssText=`
      position: absolute;
      left: ${o}%;
      top: ${n}%;
      ${l}
      animation: float-shape ${e}s ease-in-out ${r}s infinite;
      opacity: 0.6;
      z-index: 5;
    `,i}init(){this.canvas.style.display="none",this.styleEl=document.createElement("style"),this.styleEl.textContent=this.generateStyles(),document.head.appendChild(this.styleEl),this.container=document.createElement("div"),this.container.id="genuary2006",this.container.style.cssText=`
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(
        180deg,
        #0a0a20 0%,
        #1a0a30 20%,
        #2d1b4e 35%,
        #4a1942 45%,
        #7b2d5b 55%,
        #d4458b 70%,
        #ff6b9d 80%,
        #ffb366 90%,
        #fff066 100%
      );
      overflow: hidden;
      font-family: 'Orbitron', 'Arial Black', sans-serif;
    `;const t=document.createElement("div");t.style.cssText=`
      position: absolute;
      bottom: 0; left: -50%;
      width: 200%; height: 60%;
      overflow: hidden;
      z-index: 2;
    `;const a=document.createElement("div");a.style.cssText=`
      position: absolute;
      bottom: 0; left: 0;
      width: 100%; height: 200%;
      background-image: 
        linear-gradient(#ff00ff55 1px, transparent 1px),
        linear-gradient(90deg, #ff00ff55 1px, transparent 1px);
      background-size: 50px 50px;
      transform: perspective(500px) rotateX(60deg);
      transform-origin: bottom center;
      animation: grid-scroll 2s linear infinite;
    `,t.appendChild(a),this.container.appendChild(t);const i=document.createElement("div");i.style.cssText=`
      position: absolute;
      left: 50%; top: 45%;
      transform: translate(-50%, -50%);
      width: 200px; height: 200px;
      background: linear-gradient(180deg, #ff6b9d 0%, #ff00ff 30%, #ff0080 50%, #220022 50%, transparent 50%);
      border-radius: 50%;
      box-shadow: 0 0 60px #ff0080, 0 0 100px #ff008080;
      animation: sun-pulse 4s ease-in-out infinite;
      z-index: 3;
    `;for(let p=0;p<5;p++){const g=document.createElement("div");g.style.cssText=`
        position: absolute;
        left: 0; right: 0;
        height: ${8-p}px;
        background: #0a0a20;
        top: ${52+p*10}%;
      `,i.appendChild(g)}this.container.appendChild(i);const s=["triangle","circle","square"];for(let p=0;p<12;p++)this.container.appendChild(this.createFloatingShape(s[p%3],p));const o=document.createElement("div");o.style.cssText=`
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.1) 2px,
        rgba(0, 0, 0, 0.1) 4px
      );
      pointer-events: none;
      z-index: 1000;
    `,this.container.appendChild(o);const n=document.createElement("div");n.style.cssText=`
      position: absolute;
      left: 0; width: 100%;
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      animation: scanline 8s linear infinite;
      pointer-events: none;
      z-index: 1001;
    `,this.container.appendChild(n);const e=document.createElement("div");e.style.cssText=`
      position: relative;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 10px 80px;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    `;const r=document.createElement("div");r.style.cssText=`
      width: 100%;
      background: linear-gradient(90deg, #000 0%, #1a0030 50%, #000 100%);
      border-top: 2px solid #ff00ff;
      border-bottom: 2px solid #00ffff;
      padding: 8px 0;
      overflow: hidden;
      box-shadow: 0 0 20px #ff00ff;
    `;const l=document.createElement("div");l.innerHTML="★ WELCOME TO GENUARY 2006 ★ THE FUTURE OF GENERATIVE ART ★ 31 DAYS OF CREATIVE CODING ★ JOIN THE REVOLUTION ★ BEST VIEWED IN 1024x768 ★ ",l.style.cssText=`
      white-space: nowrap;
      animation: marquee-scroll 20s linear infinite;
      color: #0ff;
      font-size: 14px;
      font-family: 'VT323', monospace;
      letter-spacing: 2px;
    `,r.appendChild(l),e.appendChild(r);const f=document.createElement("div");f.style.cssText=`
      margin: 15px 0 10px;
      text-align: center;
      animation: vhs-flicker 5s infinite;
    `;const d=document.createElement("div");d.innerHTML="GENUARY",d.style.cssText=`
      font-size: clamp(48px, 12vw, 120px);
      font-weight: 900;
      background: linear-gradient(
        90deg,
        #ff0080 0%,
        #ff00ff 25%,
        #00ffff 50%,
        #ff00ff 75%,
        #ff0080 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: chrome-shine 3s linear infinite, neon-pulse 2s ease-in-out infinite;
      text-shadow: none;
      filter: drop-shadow(0 0 30px #ff00ff);
      letter-spacing: 8px;
    `;const x=document.createElement("div");x.innerHTML="2 0 0 6",x.style.cssText=`
      font-size: clamp(24px, 6vw, 60px);
      font-weight: 700;
      color: #0ff;
      letter-spacing: 20px;
      animation: cyan-pulse 2s ease-in-out infinite;
      margin-top: -10px;
    `,f.appendChild(d),f.appendChild(x),e.appendChild(f);const h=document.createElement("div");h.innerHTML="「 31 DAYS OF CREATIVE CODING 」",h.style.cssText=`
      font-size: clamp(10px, 2vw, 16px);
      color: #ffffff;
      letter-spacing: 3px;
      margin-bottom: 15px;
      text-shadow: 0 0 10px #ff0080, 0 0 20px #ff0080;
    `,e.appendChild(h);const c=document.createElement("div");c.style.cssText=`
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 15px;
    `;const v=["HOME","PROMPTS","GALLERY","FAQ","THANKS","GUESTBOOK"];this.navButtons={},v.forEach((p,g)=>{const m=document.createElement("div");m.innerHTML=p,m.style.cssText=`
        padding: 8px 16px;
        background: linear-gradient(180deg, #2a0a40 0%, #1a0030 100%);
        border: 2px solid #ff00ff;
        color: #fff;
        font-size: clamp(10px, 2vw, 14px);
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.3s;
        animation: rainbow-border 4s linear ${g*.5}s infinite;
        text-shadow: 0 0 10px #fff;
      `,m.addEventListener("mouseenter",()=>{m.style.background="linear-gradient(180deg, #ff0080 0%, #ff00ff 100%)",m.style.transform="scale(1.1) translateY(-5px)"}),m.addEventListener("mouseleave",()=>{this.currentSection!==p.toLowerCase()&&(m.style.background="linear-gradient(180deg, #2a0a40 0%, #1a0030 100%)"),m.style.transform="scale(1)"}),m.addEventListener("click",T=>{T.stopPropagation(),this.showSection(p.toLowerCase())}),this.navButtons[p.toLowerCase()]=m,c.appendChild(m)}),e.appendChild(c),this.contentArea=document.createElement("div"),this.contentArea.style.cssText=`
      width: 100%;
      max-width: 900px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 20px;
    `,e.appendChild(this.contentArea);const u=document.createElement("div");u.innerHTML="_",u.style.cssText=`
      position: absolute;
      bottom: 20px;
      font-size: 24px;
      color: #0f0;
      animation: blink-cursor 1s step-end infinite;
      font-family: 'VT323', monospace;
    `,e.appendChild(u),this.showSection("home"),this.container.appendChild(e),this.canvas.parentNode.insertBefore(this.container,this.canvas.nextSibling),this.container.addEventListener("click",p=>{this.currentSection==="home"&&this.counterEl&&(this.visitors++,this.counterEl.innerHTML=this.visitors.toString().padStart(6,"0"))})}showSection(t){switch(this.currentSection=t,this.contentArea.innerHTML="",Object.entries(this.navButtons).forEach(([a,i])=>{a===t?i.style.background="linear-gradient(180deg, #ff0080 0%, #ff00ff 100%)":i.style.background="linear-gradient(180deg, #2a0a40 0%, #1a0030 100%)"}),t){case"home":this.renderHome();break;case"prompts":this.renderPrompts();break;case"gallery":this.renderGallery();break;case"faq":this.renderFAQ();break;case"thanks":this.renderThanks();break;case"guestbook":this.renderGuestbook();break}}renderHome(){const t=document.createElement("div");t.style.cssText=`
      display: flex;
      gap: 20px;
      width: 100%;
      flex: 1;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
    `;const a=document.createElement("div");a.style.cssText=`
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #0ff;
      padding: 20px 40px;
      flex: 1;
      min-width: 280px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 0 20px #0ff, inset 0 0 20px rgba(0, 255, 255, 0.1);
      animation: bounce-in 0.5s ease-out;
    `;const i=document.createElement("div");i.innerHTML="TODAY'S PROMPT",i.style.cssText="font-size: 12px; color: #0ff; letter-spacing: 4px; margin-bottom: 10px;";const s=document.createElement("div");s.innerHTML="JAN 28",s.style.cssText="font-size: 24px; color: #ff0080; font-weight: 900; text-shadow: 0 0 20px #ff0080;";const o=document.createElement("div");o.innerHTML='"No libraries, no canvas, only HTML elements"',o.style.cssText="font-size: 16px; color: #fff; font-style: italic; margin-top: 10px; font-family: 'VT323', monospace; animation: glitch 10s infinite;",a.appendChild(i),a.appendChild(s),a.appendChild(o),t.appendChild(a);const n=document.createElement("div");n.style.cssText=`
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #ff0080;
      padding: 20px;
      flex: 1;
      min-width: 280px;
      max-width: 400px;
      box-shadow: 0 0 20px #ff0080;
      animation: bounce-in 0.5s ease-out 0.1s both;
    `;const e=document.createElement("div");e.style.cssText="text-align: center; margin-bottom: 20px;";const r=document.createElement("div");r.innerHTML="► VISITORS ◄",r.style.cssText="font-size: 12px; color: #ff0080; letter-spacing: 2px; margin-bottom: 5px;";const l=document.createElement("div");l.innerHTML=this.visitors.toString().padStart(6,"0"),l.style.cssText="font-family: 'VT323', monospace; font-size: 36px; color: #0f0; background: #000; padding: 8px 20px; border: 2px solid #0f0; box-shadow: 0 0 10px #0f0, inset 0 0 10px rgba(0, 255, 0, 0.2); letter-spacing: 5px; display: inline-block;",e.appendChild(r),e.appendChild(l),n.appendChild(e),this.counterEl=l;const f=document.createElement("div");f.style.cssText="font-family: 'VT323', monospace; color: #0ff; font-size: 14px; line-height: 1.8;",f.innerHTML=`
      <div>📅 DAYS COMPLETED: <span style="color: #ff0080">27 / 31</span></div>
      <div>🎨 ARTWORKS CREATED: <span style="color: #ffff00">${Math.floor(this.visitors*2.7)}</span></div>
      <div>🌐 COUNTRIES REACHED: <span style="color: #00ff80">42</span></div>
      <div>💾 DISK SPACE USED: <span style="color: #ff00ff">4.2 MB</span></div>
      <div>☕ COFFEES CONSUMED: <span style="color: #ff6600">∞</span></div>
    `,n.appendChild(f);const d=document.createElement("div");d.style.cssText="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ff008040; text-align: center;",d.innerHTML=`
      <div style="color: #ff0080; font-size: 12px; margin-bottom: 8px;">◄◄ CREATIVE CODING WEBRING ►►</div>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <span style="color: #0ff; cursor: pointer;">[ ◄ PREV ]</span>
        <span style="color: #ffff00; cursor: pointer;">[ RANDOM ]</span>
        <span style="color: #0ff; cursor: pointer;">[ NEXT ► ]</span>
      </div>
    `,n.appendChild(d),t.appendChild(n),this.contentArea.appendChild(t);const x=document.createElement("div");x.style.cssText="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; justify-content: center;",["NETSCAPE NOW!","MADE WITH ♥","Y2K READY","BEST VIEWED 1024x768","NO FLASH REQUIRED","WEBRING MEMBER"].forEach(h=>{const c=document.createElement("div");c.innerHTML=h,c.style.cssText="padding: 5px 12px; background: linear-gradient(180deg, #333 0%, #111 100%); border: 1px solid #666; color: #aaa; font-size: 10px; font-family: 'VT323', monospace; cursor: pointer; transition: all 0.2s;",c.addEventListener("mouseenter",()=>{c.style.borderColor="#ff00ff",c.style.color="#fff",c.style.boxShadow="0 0 10px #ff00ff"}),c.addEventListener("mouseleave",()=>{c.style.borderColor="#666",c.style.color="#aaa",c.style.boxShadow="none"}),x.appendChild(c)}),this.contentArea.appendChild(x)}renderPrompts(){const t=document.createElement("div");t.style.cssText=`
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ff00ff;
      padding: 20px;
      width: 100%;
      flex: 1;
      overflow-y: auto;
      box-shadow: 0 0 30px #ff00ff;
      animation: bounce-in 0.5s ease-out;
      display: flex;
      flex-direction: column;
    `;const a=document.createElement("div");a.innerHTML="★ ALL 31 PROMPTS ★",a.style.cssText="font-size: 18px; color: #ff00ff; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px #ff00ff;",t.appendChild(a),b.forEach((i,s)=>{const o=document.createElement("div");o.style.cssText=`
        display: flex;
        padding: 8px;
        border-bottom: 1px solid #ff00ff40;
        transition: all 0.2s;
        cursor: pointer;
      `,o.addEventListener("mouseenter",()=>{o.style.background="#ff00ff30",o.style.transform="translateX(10px)"}),o.addEventListener("mouseleave",()=>{o.style.background="transparent",o.style.transform="translateX(0)"});const n=document.createElement("span");n.innerHTML=`DAY ${(s+1).toString().padStart(2,"0")}`,n.style.cssText="color: #0ff; font-family: 'VT323', monospace; width: 70px; flex-shrink: 0;";const e=document.createElement("span");e.innerHTML=i,e.style.cssText="color: #fff; font-family: 'VT323', monospace;",o.appendChild(n),o.appendChild(e),t.appendChild(o)}),this.contentArea.appendChild(t)}renderGallery(){const t=document.createElement("div");t.style.cssText=`
      text-align: center;
      animation: bounce-in 0.5s ease-out;
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
    `;const a=document.createElement("div");a.innerHTML="🎨 GALLERY 🎨",a.style.cssText=`
      font-size: 24px;
      color: #ff00ff;
      margin-bottom: 15px;
      text-shadow: 0 0 20px #ff00ff;
    `,t.appendChild(a);const i=document.createElement("div");i.innerHTML="Click any thumbnail to view that day!",i.style.cssText=`
      color: #0ff;
      font-family: 'VT323', monospace;
      margin-bottom: 15px;
    `,t.appendChild(i);const s=document.createElement("div");s.style.cssText=`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid #ff00ff;
      box-shadow: 0 0 20px #ff00ff;
      flex: 1;
      overflow-y: auto;
      align-content: start;
    `;for(let n=1;n<=30;n++){const e=document.createElement("div");e.style.cssText=`
        position: relative;
        aspect-ratio: 1;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid #333;
        overflow: hidden;
      `;const r=document.createElement("img");r.src=`/${n.toString().padStart(3,"0")}.jpg`,r.alt=`Day ${n}`,r.style.cssText=`
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(1.2) contrast(1.1);
      `;const l=document.createElement("div");l.innerHTML=n.toString().padStart(2,"0"),l.style.cssText=`
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: #0ff;
        font-size: 10px;
        font-family: 'VT323', monospace;
        padding: 2px;
        text-align: center;
      `,e.appendChild(r),e.appendChild(l),e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)",e.style.zIndex="10",e.style.border="2px solid #ff00ff",e.style.boxShadow="0 0 15px #ff00ff"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.zIndex="1",e.style.border="2px solid #333",e.style.boxShadow="none"}),e.addEventListener("click",f=>{f.stopPropagation();const d=document.querySelector(`#day-${n}`);d?(this.stop(),d.scrollIntoView({behavior:"smooth"})):alert(`DAY ${n}: ${b[n-1]}

[Loading from floppy disk... 💾]`)}),s.appendChild(e)}t.appendChild(s);const o=document.createElement("div");o.innerHTML="🚧 DAY 31 COMING SOON! 🚧",o.style.cssText=`
      margin-top: 15px;
      color: #ffff00;
      font-family: 'VT323', monospace;
      animation: construction-blink 0.5s infinite;
    `,t.appendChild(o),this.contentArea.appendChild(t)}renderFAQ(){const t=document.createElement("div");t.style.cssText=`
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #0ff;
      padding: 20px 30px;
      width: 100%;
      flex: 1;
      overflow-y: auto;
      box-shadow: 0 0 30px #0ff;
      animation: bounce-in 0.5s ease-out;
    `;const a=document.createElement("div");a.innerHTML="❓ F.A.Q. ❓",a.style.cssText="font-size: 24px; color: #0ff; text-align: center; margin-bottom: 20px; text-shadow: 0 0 10px #0ff;",t.appendChild(a),[{q:"What is Genuary?",a:"31 days of creative coding prompts to start the year! Make something every day based on the daily prompt. Share it online with #genuary and #genuary2006!"},{q:"Do I need to be an expert?",a:"NO! Everyone is welcome. Beginners, pros, anyone who wants to create! The point is to practice and have fun, not to be perfect."},{q:"What tools can I use?",a:"Anything! Processing, Flash, HTML, DHTML, Java applets, Director, Visual Basic... whatever makes you happy! The web is your canvas!"},{q:"Is it a competition?",a:"Not at all! It's about creativity and community. No prizes, no judges, just good vibes and creative energy ✨"},{q:"Can I use libraries?",a:"Yes! Use whatever helps you create... except for Day 28 where we go pure HTML 😉"},{q:"What if I miss a day?",a:"No worries! Do what you can. Even one piece is a win. You can always catch up or skip prompts that don't inspire you."},{q:"How do I share my work?",a:"Post on your Geocities page, LiveJournal, DeviantArt, or email us at genuary@geocities.com! Use hashtag #genuary2006!"},{q:"Can I do it in teams?",a:"Absolutely! Collaborate with friends, do it solo, remix others' work (with credit). Creativity has no rules!"}].forEach(({q:s,a:o})=>{const n=document.createElement("div");n.innerHTML=`▶ ${s}`,n.style.cssText="color: #ff0080; font-weight: bold; margin-top: 15px; cursor: pointer;";const e=document.createElement("div");e.innerHTML=o,e.style.cssText="color: #fff; font-family: 'VT323', monospace; margin-left: 20px; margin-top: 5px;",t.appendChild(n),t.appendChild(e)}),this.contentArea.appendChild(t)}renderThanks(){const t=document.createElement("div");t.style.cssText=`
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #ffff00;
      padding: 30px;
      width: 100%;
      flex: 1;
      text-align: center;
      box-shadow: 0 0 30px #ffff00;
      animation: bounce-in 0.5s ease-out;
      display: flex;
      flex-direction: column;
      justify-content: center;
    `;const a=document.createElement("div");a.innerHTML="💖 SPECIAL THANKS 💖",a.style.cssText="font-size: 24px; color: #ffff00; margin-bottom: 20px; text-shadow: 0 0 10px #ffff00;",t.appendChild(a);const i=["The creative coding community","Processing & p5.js creators","Everyone who participates","Coffee & energy drinks ☕","Synthwave playlists 🎵","The spirit of Web 1.0","Geocities & Angelfire memories","Winamp (it really whips the llama's ass)","All the webring friends","YOU for visiting! 💖"],s=["#ff0080","#00ffff","#ff00ff","#ffff00","#00ff80","#fff","#ff6600","#00ff00","#ff0080","#00ffff"];i.forEach((n,e)=>{const r=document.createElement("div");r.innerHTML=`★ ${n} ★`,r.style.cssText=`
        color: ${s[e%s.length]};
        margin: 8px 0;
        font-family: 'VT323', monospace;
        font-size: 18px;
        animation: wave 2s ease-in-out ${e*.15}s infinite;
        text-shadow: 0 0 10px ${s[e%s.length]};
      `,t.appendChild(r)});const o=document.createElement("div");o.innerHTML="💜💖💜💖💜",o.style.cssText="font-size: 24px; margin-top: 20px;",t.appendChild(o),this.contentArea.appendChild(t)}renderGuestbook(){const t=document.createElement("div");t.style.cssText=`
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #00ff80;
      padding: 20px;
      width: 100%;
      flex: 1;
      box-shadow: 0 0 30px #00ff80;
      animation: bounce-in 0.5s ease-out;
      display: flex;
      flex-direction: column;
    `;const a=document.createElement("div");a.innerHTML="📖 GUESTBOOK 📖",a.style.cssText="font-size: 24px; color: #00ff80; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px #00ff80;",t.appendChild(a);const i=document.createElement("div");i.innerHTML="Sign our guestbook! Leave a message!",i.style.cssText="color: #aaa; text-align: center; margin-bottom: 15px; font-family: 'VT323', monospace;",t.appendChild(i);const s=document.createElement("div");s.style.cssText="flex: 1; overflow-y: auto; margin-bottom: 15px;",E.forEach(r=>{const l=document.createElement("div");l.style.cssText=`
        background: #111;
        border: 1px solid #00ff8080;
        padding: 10px;
        margin-bottom: 10px;
      `;const f=document.createElement("div");f.innerHTML=`<span style="color: #ff0080">${r.name}</span> <span style="color: #666">wrote on ${r.date}:</span>`,f.style.cssText="font-size: 12px; margin-bottom: 5px;";const d=document.createElement("div");d.innerHTML=r.msg,d.style.cssText="color: #0ff; font-family: 'VT323', monospace;",l.appendChild(f),l.appendChild(d),s.appendChild(l)}),t.appendChild(s);const o=document.createElement("div");o.style.cssText="border-top: 1px solid #00ff80; padding-top: 15px;";const n=document.createElement("input");n.placeholder="Your message here...",n.style.cssText=`
      width: 100%;
      padding: 10px;
      background: #000;
      border: 2px solid #00ff80;
      color: #0ff;
      font-family: 'VT323', monospace;
      font-size: 16px;
      box-sizing: border-box;
    `;const e=document.createElement("div");e.innerHTML="✍️ SIGN GUESTBOOK",e.style.cssText=`
      margin-top: 10px;
      padding: 10px;
      background: linear-gradient(180deg, #00ff80 0%, #008040 100%);
      color: #000;
      font-weight: bold;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    `,e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.05)",e.style.boxShadow="0 0 20px #00ff80"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.boxShadow="none"}),e.addEventListener("click",r=>{r.stopPropagation(),n.value.trim()?(alert(`Thanks for signing! Your message "${n.value}" has been saved to our Geocities database! 💾`),n.value=""):alert("Please enter a message!")}),o.appendChild(n),o.appendChild(e),t.appendChild(o),this.contentArea.appendChild(t)}start(){this.init(),this.running=!0}stop(){this.running=!1,this.container&&this.container.remove(),this.styleEl&&this.styleEl.remove(),this.canvas.style.display=""}}function C(y){const t=new w(y);return t.start(),{stop:()=>t.stop(),game:t}}export{C as default};
