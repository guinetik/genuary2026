class L{constructor(t){this.canvas=t,this.running=!1,this.visitors=Math.floor(Math.random()*9e3)+1e3}generateStyles(){return`
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
    `}createFloatingShape(t,x){const p=document.createElement("div"),o=30+Math.random()*50,m=Math.random()*100,h=Math.random()*60,n=4+Math.random()*4,l=Math.random()*4;let s="";const f=["#ff0080","#00ffff","#ff00ff","#ffff00","#00ff80"],a=f[x%f.length];return t==="triangle"?s=`
        width: 0; height: 0;
        border-left: ${o/2}px solid transparent;
        border-right: ${o/2}px solid transparent;
        border-bottom: ${o}px solid transparent;
        border-bottom-color: ${a};
        filter: drop-shadow(0 0 10px ${a});
      `:t==="circle"?s=`
        width: ${o}px; height: ${o}px;
        border: 3px solid ${a};
        border-radius: 50%;
        box-shadow: 0 0 20px ${a}, inset 0 0 20px ${a}40;
      `:s=`
        width: ${o}px; height: ${o}px;
        border: 3px solid ${a};
        box-shadow: 0 0 20px ${a};
        transform: rotate(45deg);
      `,p.style.cssText=`
      position: absolute;
      left: ${m}%;
      top: ${h}%;
      ${s}
      animation: float-shape ${n}s ease-in-out ${l}s infinite;
      opacity: 0.6;
      z-index: 5;
    `,p}init(){this.canvas.style.display="none",this.styleEl=document.createElement("style"),this.styleEl.textContent=this.generateStyles(),document.head.appendChild(this.styleEl),this.container=document.createElement("div"),this.container.id="genuary2006",this.container.style.cssText=`
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
    `;const x=document.createElement("div");x.style.cssText=`
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
    `,t.appendChild(x),this.container.appendChild(t);const p=document.createElement("div");p.style.cssText=`
      position: absolute;
      left: 50%; top: 45%;
      transform: translate(-50%, -50%);
      width: 200px; height: 200px;
      background: linear-gradient(180deg, #ff6b9d 0%, #ff00ff 30%, #ff0080 50%, #220022 50%, transparent 50%);
      border-radius: 50%;
      box-shadow: 0 0 60px #ff0080, 0 0 100px #ff008080;
      animation: sun-pulse 4s ease-in-out infinite;
      z-index: 3;
    `;for(let e=0;e<5;e++){const r=document.createElement("div");r.style.cssText=`
        position: absolute;
        left: 0; right: 0;
        height: ${8-e}px;
        background: #0a0a20;
        top: ${52+e*10}%;
      `,p.appendChild(r)}this.container.appendChild(p);const o=["triangle","circle","square"];for(let e=0;e<12;e++)this.container.appendChild(this.createFloatingShape(o[e%3],e));const m=document.createElement("div");m.style.cssText=`
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
    `,this.container.appendChild(m);const h=document.createElement("div");h.style.cssText=`
      position: absolute;
      left: 0; width: 100%;
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      animation: scanline 8s linear infinite;
      pointer-events: none;
      z-index: 1001;
    `,this.container.appendChild(h);const n=document.createElement("div");n.style.cssText=`
      position: relative;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 10px 80px;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    `;const l=document.createElement("div");l.style.cssText=`
      width: 100%;
      background: linear-gradient(90deg, #000 0%, #1a0030 50%, #000 100%);
      border-top: 2px solid #ff00ff;
      border-bottom: 2px solid #00ffff;
      padding: 8px 0;
      overflow: hidden;
      box-shadow: 0 0 20px #ff00ff;
    `;const s=document.createElement("div");s.innerHTML="★ WELCOME TO GENUARY 2006 ★ THE FUTURE OF GENERATIVE ART ★ 31 DAYS OF CREATIVE CODING ★ JOIN THE REVOLUTION ★ BEST VIEWED IN 1024x768 ★ ",s.style.cssText=`
      white-space: nowrap;
      animation: marquee-scroll 20s linear infinite;
      color: #0ff;
      font-size: 14px;
      font-family: 'VT323', monospace;
      letter-spacing: 2px;
    `,l.appendChild(s),n.appendChild(l);const f=document.createElement("div");f.style.cssText=`
      margin: 15px 0 10px;
      text-align: center;
      animation: vhs-flicker 5s infinite;
    `;const a=document.createElement("div");a.innerHTML="GENUARY",a.style.cssText=`
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
    `;const u=document.createElement("div");u.innerHTML="2 0 0 6",u.style.cssText=`
      font-size: clamp(24px, 6vw, 60px);
      font-weight: 700;
      color: #0ff;
      letter-spacing: 20px;
      animation: cyan-pulse 2s ease-in-out infinite;
      margin-top: -10px;
    `,f.appendChild(a),f.appendChild(u),n.appendChild(f);const b=document.createElement("div");b.innerHTML="「 31 DAYS OF CREATIVE CODING 」",b.style.cssText=`
      font-size: clamp(10px, 2vw, 16px);
      color: #ffffff;
      letter-spacing: 3px;
      margin-bottom: 15px;
      text-shadow: 0 0 10px #ff0080, 0 0 20px #ff0080;
    `,n.appendChild(b);const y=document.createElement("div");y.style.cssText=`
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 15px;
    `,["HOME","PROMPTS","GALLERY","FAQ","THANKS","GUESTBOOK"].forEach((e,r)=>{const i=document.createElement("div");i.innerHTML=e,i.style.cssText=`
        padding: 8px 16px;
        background: linear-gradient(180deg, #2a0a40 0%, #1a0030 100%);
        border: 2px solid #ff00ff;
        color: #fff;
        font-size: clamp(10px, 2vw, 14px);
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.3s;
        animation: rainbow-border 4s linear ${r*.5}s infinite;
        text-shadow: 0 0 10px #fff;
      `,i.addEventListener("mouseenter",()=>{i.style.background="linear-gradient(180deg, #ff0080 0%, #ff00ff 100%)",i.style.transform="scale(1.1) translateY(-5px)"}),i.addEventListener("mouseleave",()=>{i.style.background="linear-gradient(180deg, #2a0a40 0%, #1a0030 100%)",i.style.transform="scale(1)"}),y.appendChild(i)}),n.appendChild(y);const d=document.createElement("div");d.style.cssText=`
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #0ff;
      padding: 15px 30px;
      margin: 8px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 0 20px #0ff, inset 0 0 20px rgba(0, 255, 255, 0.1);
    `;const T=document.createElement("div");T.innerHTML="TODAY'S PROMPT",T.style.cssText=`
      font-size: 12px;
      color: #0ff;
      letter-spacing: 4px;
      margin-bottom: 10px;
    `;const E=document.createElement("div");E.innerHTML="JAN 28",E.style.cssText=`
      font-size: 24px;
      color: #ff0080;
      font-weight: 900;
      text-shadow: 0 0 20px #ff0080;
    `;const v=document.createElement("div");v.innerHTML='"No libraries, no canvas, only HTML elements"',v.style.cssText=`
      font-size: 16px;
      color: #fff;
      font-style: italic;
      margin-top: 10px;
      font-family: 'VT323', monospace;
      animation: glitch 10s infinite;
    `,d.appendChild(T),d.appendChild(E),d.appendChild(v),n.appendChild(d);const g=document.createElement("div");g.style.cssText=`
      margin-top: 10px;
      text-align: center;
    `;const w=document.createElement("div");w.innerHTML="► VISITORS ◄",w.style.cssText=`
      font-size: 10px;
      color: #ff0080;
      letter-spacing: 2px;
    `;const c=document.createElement("div");c.innerHTML=this.visitors.toString().padStart(6,"0"),c.id="visitor-count",c.style.cssText=`
      font-family: 'VT323', monospace;
      font-size: 32px;
      color: #0f0;
      background: #000;
      padding: 5px 15px;
      border: 2px solid #0f0;
      box-shadow: 0 0 10px #0f0, inset 0 0 10px rgba(0, 255, 0, 0.2);
      letter-spacing: 5px;
    `,g.appendChild(w),g.appendChild(c),n.appendChild(g),this.counterEl=c;const k=document.createElement("div");k.style.cssText=`
      display: flex;
      gap: 10px;
      margin-top: 10px;
      flex-wrap: wrap;
      justify-content: center;
    `,["NETSCAPE NOW!","MADE WITH ♥","Y2K READY","WEBRING"].forEach(e=>{const r=document.createElement("div");r.innerHTML=e,r.style.cssText=`
        padding: 5px 12px;
        background: linear-gradient(180deg, #333 0%, #111 100%);
        border: 1px solid #666;
        color: #aaa;
        font-size: 10px;
        font-family: 'VT323', monospace;
      `,k.appendChild(r)}),n.appendChild(k);const C=document.createElement("div");C.innerHTML="_",C.style.cssText=`
      position: absolute;
      bottom: 20px;
      font-size: 24px;
      color: #0f0;
      animation: blink-cursor 1s step-end infinite;
      font-family: 'VT323', monospace;
    `,n.appendChild(C),this.container.appendChild(n),this.canvas.parentNode.insertBefore(this.container,this.canvas.nextSibling),this.container.addEventListener("click",()=>{this.visitors++,this.counterEl.innerHTML=this.visitors.toString().padStart(6,"0")})}start(){this.init(),this.running=!0}stop(){this.running=!1,this.container&&this.container.remove(),this.styleEl&&this.styleEl.remove(),this.canvas.style.display=""}}function S(M){const t=new L(M);return t.start(),{stop:()=>t.stop(),game:t}}export{S as default};
