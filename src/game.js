(() => {
  "use strict";

  // ALVINE 2.5D — moteur maison : boucle fixe, physique, caméra et rendu multi-plans.
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const stateLabel = document.querySelector("#state-label");
  const W = canvas.width, H = canvas.height;
  const keys = new Set();
  const FIXED_STEP = 1 / 60;
  const WORLD = { width: 2200, floorY: 190 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  ctx.imageSmoothingEnabled = false;

  const sprite = new Image();
  sprite.src = "assets/alvine.svg";
  let spriteReady = false;
  sprite.onload = () => { spriteReady = true; };
  sprite.onerror = () => { spriteReady = false; console.error("Impossible de charger assets/alvine.svg"); };

  const player = {
    x: 120, y: WORLD.floorY - 64, vx: 0, vy: 0,
    width: 48, height: 64, facing: 1, grounded: true,
    jumpCount: 0, anim: 0, state: "idle"
  };
  const camera = { x: 0 };
  const particles = [];
  let time = 0;

  function roundedRect(x,y,w,h,r,fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
    ctx.fill();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#5da7e8");
    g.addColorStop(.58,"#a8d7e8");
    g.addColorStop(1,"#d4e4cb");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // Lointains doux : reliefs atmosphériques en plusieurs plans.
    function ridge(offset, base, amp, color, parallax, step) {
      ctx.beginPath(); ctx.moveTo(0,H);
      for (let x=0;x<=W+step;x+=step) {
        const wx=x+camera.x*parallax;
        const y=base+Math.sin(wx*.008)*amp+Math.sin(wx*.021)*amp*.34+Math.sin(wx*.003)*amp*.7;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
    }
    ridge(0,92,16,"#8cb9bd",.12,12);
    ridge(0,126,20,"#6f9c91",.22,10);
    ridge(0,153,13,"#537d68",.34,8);

    // Brume lumineuse qui donne de la profondeur sans encombrer la scène.
    const mist=ctx.createLinearGradient(0,145,0,205);
    mist.addColorStop(0,"rgba(230,244,226,0)");
    mist.addColorStop(.65,"rgba(230,244,226,.25)");
    mist.addColorStop(1,"rgba(230,244,226,0)");
    ctx.fillStyle=mist; ctx.fillRect(0,145,W,65);
  }

  function drawGround() {
    const horizon = WORLD.floorY;
    const top = horizon;
    // Ombre portée et tranche de terre : volumes lisibles, pas un simple trait.
    const topGrad=ctx.createLinearGradient(0,top,0,top+18);
    topGrad.addColorStop(0,"#a4c65e");
    topGrad.addColorStop(.28,"#638b3e");
    topGrad.addColorStop(1,"#46603a");
    ctx.fillStyle=topGrad; ctx.fillRect(0,top,W,H-top);

    // Bande d'herbe supérieure, avec variation de lumière.
    const grass=ctx.createLinearGradient(0,top-5,0,top+12);
    grass.addColorStop(0,"#d1e978");
    grass.addColorStop(.38,"#8fb84c");
    grass.addColorStop(1,"#537a3d");
    ctx.fillStyle=grass; ctx.fillRect(0,top-5,W,17);

    // Motif irrégulier d'herbe, stable dans le monde pour éviter le scintillement.
    for(let wx=Math.floor(camera.x/7)*7-20; wx<camera.x+W+30; wx+=7){
      const sx=wx-camera.x;
      const n=Math.abs(Math.sin(wx*12.9898)*43758.5453)%1;
      const h=2+Math.floor(n*5);
      ctx.fillStyle=n>.55?"#d5ed78":n>.25?"#9fc956":"#6e9844";
      ctx.fillRect(Math.round(sx),Math.round(top-2-h),1,h+2);
      if(n>.76){ctx.fillStyle="#e8f38a";ctx.fillRect(Math.round(sx+2),Math.round(top-4),2,1);}
    }

    // Terre stratifiée en facettes : profondeur 2.5D.
    const soil=ctx.createLinearGradient(0,top+10,0,H);
    soil.addColorStop(0,"#79513a"); soil.addColorStop(.35,"#684632"); soil.addColorStop(1,"#382f2a");
    ctx.fillStyle=soil; ctx.fillRect(0,top+10,W,H-top-10);
    for(let wx=Math.floor(camera.x/34)*34-34;wx<camera.x+W+40;wx+=34){
      const sx=wx-camera.x;
      const seed=Math.abs(Math.sin(wx*2.17)*1000)%1;
      const yy=top+23+seed*44;
      ctx.fillStyle=seed>.5?"#8b6042":"#513b30";
      ctx.beginPath();
      ctx.moveTo(sx,yy);ctx.lineTo(sx+12,yy-5);ctx.lineTo(sx+27,yy+3);ctx.lineTo(sx+21,yy+17);ctx.lineTo(sx+5,yy+15);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(220,157,94,.20)";
      ctx.fillRect(sx+5,yy+2,8,2);
      ctx.fillStyle="rgba(25,27,24,.23)";
      ctx.fillRect(sx+17,yy+11,8,3);
    }
    // Petites racines et strates de roche.
    for(let wx=Math.floor(camera.x/83)*83;wx<camera.x+W+83;wx+=83){
      const sx=wx-camera.x;
      ctx.strokeStyle="rgba(40,39,29,.5)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx,top+14);ctx.lineTo(sx+4,top+29);ctx.lineTo(sx+1,top+38);ctx.stroke();
      ctx.fillStyle="#9a704a";ctx.fillRect(sx+25,top+52,7,2);
    }
    ctx.fillStyle="#282b26";ctx.fillRect(0,H-3,W,3);
  }

  function addDust(x,y,count=5){
    for(let i=0;i<count;i++) particles.push({x,y,vx:(Math.random()-.5)*1.2,vy:-Math.random()*1.1,life:.45,max:.45,size:1+Math.random()*2});
  }
  function drawParticles(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.life-=dt;p.x+=p.vx;p.y+=p.vy;p.vy+=.035;
      if(p.life<=0){particles.splice(i,1);continue;}
      ctx.globalAlpha=p.life/p.max;
      ctx.fillStyle="#e4d39b";ctx.fillRect(Math.round(p.x-camera.x),Math.round(p.y),p.size,p.size);
    }
    ctx.globalAlpha=1;
  }

function drawFallbackCat(x,y) {
    // Secours visible même si le fichier de sprite ne charge pas.
    ctx.fillStyle="#30231e"; ctx.fillRect(x+14,y+7,22,18);
    ctx.fillStyle="#a96b3d"; ctx.fillRect(x+12,y+11,25,15);
    ctx.fillStyle="#30231e"; ctx.fillRect(x+13,y+4,7,9); ctx.fillRect(x+30,y+4,7,9);
    ctx.fillStyle="#d9a06b"; ctx.fillRect(x+17,y+14,4,3); ctx.fillRect(x+29,y+14,4,3);
    ctx.fillStyle="#20201b"; ctx.fillRect(x+19,y+15,2,3); ctx.fillRect(x+30,y+15,2,3);
    ctx.fillStyle="#a96b3d"; ctx.fillRect(x+17,y+25,19,23); ctx.fillRect(x+12,y+28,7,14); ctx.fillRect(x+34,y+28,6,14);
    ctx.fillStyle="#38251f"; ctx.fillRect(x+20,y+26,4,7); ctx.fillRect(x+29,y+31,4,6);
    ctx.fillStyle="#a96b3d"; ctx.fillRect(x+18,y+47,7,12); ctx.fillRect(x+29,y+47,7,12);
    ctx.fillStyle="#2b211e"; ctx.fillRect(x+15,y+58,11,4); ctx.fillRect(x+27,y+58,11,4);
    ctx.fillStyle="#38251f"; ctx.fillRect(x+9,y+39,5,4); ctx.fillRect(x+6,y+34,4,7);
  }

    function drawPlayer() {
    const sx=Math.round(player.x-camera.x);
    const sy=Math.round(player.y);
    const moving=player.grounded&&Math.abs(player.vx)>.25;
    const frame=0;
    const bob=player.grounded&&!moving?Math.sin(time*2.1)*.7:0;
    // Ombre douce au sol, étirée pendant le saut.
    const shadowScale=player.grounded?1:clamp(1-(WORLD.floorY-(player.y+player.height))/150,.45,1);
    ctx.globalAlpha=.25*shadowScale;
    ctx.fillStyle="#1d2b25";ctx.beginPath();
    ctx.ellipse(sx+24,WORLD.floorY+2,17*shadowScale,3*shadowScale,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

    ctx.save();
    if(player.facing<0){ctx.translate(sx+48,0);ctx.scale(-1,1);} else {ctx.translate(sx,0);}
    if(spriteReady){
      ctx.drawImage(sprite,0,0,48,64,0,Math.round(player.y+bob),48,64);
    } else {
      // Repli temporaire le temps que l'image charge.
      drawFallbackCat(sx, Math.round(player.y+bob));
    }
    ctx.restore();
  }

  function render(dt) {
    drawSky();
    drawGround();
    drawParticles(dt);
    drawPlayer();
    // Lueur subtile sur la scène, sans filtre flou qui détruirait les pixels.
    const glow=ctx.createRadialGradient(360,80,5,360,80,260);
    glow.addColorStop(0,"rgba(255,244,194,.13)");
    glow.addColorStop(1,"rgba(255,244,194,0)");
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  }

  function update(dt) {
    const left=keys.has("ArrowLeft")||keys.has("KeyA");
    const right=keys.has("ArrowRight")||keys.has("KeyD");
    const dir=(right?1:0)-(left?1:0);
    const speed=keys.has("ShiftLeft")||keys.has("ShiftRight")?3.4:2.25;
    const target=dir*speed;
    const accel=player.grounded?16:8;
    player.vx=lerp(player.vx,target,Math.min(1,accel*dt));
    if(!dir) player.vx*=Math.pow(player.grounded?.76:.96,dt*60);
    if(Math.abs(player.vx)<.025)player.vx=0;
    if(dir)player.facing=dir;

    const wasGrounded=player.grounded;
    player.vy+=19*dt;
    player.x=clamp(player.x+player.vx*dt*60,0,WORLD.width-player.width);
    player.y+=player.vy*dt*60;
    player.grounded=false;
    if(player.y+player.height>=WORLD.floorY){
      player.y=WORLD.floorY-player.height;
      if(!wasGrounded&&player.vy>2)addDust(player.x+24,WORLD.floorY-2,7);
      player.vy=0;player.grounded=true;player.jumpCount=0;
    }
    if(player.grounded&&Math.abs(player.vx)>.25)player.anim+=dt*60;
    time+=dt;
    camera.x=lerp(camera.x,clamp(player.x-W*.36,0,WORLD.width-W),Math.min(1,dt*5));
    player.state=!player.grounded?"jump":Math.abs(player.vx)>.25?"walk":"idle";
    stateLabel.textContent=player.state==="jump"?"SAUT":player.state==="walk"?"MARCHE":"REPOS";
  }

  let previous=0,accumulator=0;
  function loop(now){
    if(!previous)previous=now;
    accumulator+=Math.min(.05,(now-previous)/1000);previous=now;
    while(accumulator>=FIXED_STEP){update(FIXED_STEP);accumulator-=FIXED_STEP;}
    render(accumulator);
    requestAnimationFrame(loop);
  }

  addEventListener("keydown",e=>{
    if(["ArrowLeft","ArrowRight","ArrowUp","Space"].includes(e.code))e.preventDefault();
    keys.add(e.code);
    if((e.code==="Space"||e.code==="ArrowUp")&&player.jumpCount<2){
      player.vy=player.jumpCount===0?-7.1:-6.2;
      player.grounded=false;player.jumpCount++;
      addDust(player.x+24,WORLD.floorY-2,4);
    }
  });
  addEventListener("keyup",e=>keys.delete(e.code));
  addEventListener("blur",()=>keys.clear());
  document.addEventListener("visibilitychange",()=>{if(document.hidden)keys.clear();});

  render(0);
  requestAnimationFrame(loop);
})();