(() => {
  "use strict";

  // Petit moteur maison : rendu basse résolution, physique simple et animation à pas fixes.
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const stateLabel = document.getElementById("state-label");
  const W = canvas.width;
  const H = canvas.height;
  const FLOOR_Y = 218;
  const keys = new Set();
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  ctx.imageSmoothingEnabled = false;

  const player = {
    x: 104, y: FLOOR_Y - 44, vx: 0, vy: 0,
    w: 25, h: 44, facing: 1, grounded: true,
    animTime: 0, state: "idle", coyote: 0
  };

  const palette = {
    outline: "#29221d", dark: "#493126", brown: "#795039",
    warm: "#a66e43", light: "#c18b58", cream: "#e5c99a",
    stripe: "#30231e", pink: "#bd7770", eye: "#d6b94e",
    groundTop: "#71834e", groundMid: "#596c3e", soil: "#594634",
    soilDark: "#40352b", soilLight: "#806044"
  };

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawGround() {
    // Une seule bande de terre, avec une bordure herbeuse et des pixels de texture.
    rect(0, FLOOR_Y, W, H - FLOOR_Y, palette.soil);
    rect(0, FLOOR_Y, W, 4, "#394c36");
    rect(0, FLOOR_Y, W, 2, palette.groundTop);
    rect(0, FLOOR_Y + 4, W, 3, palette.groundMid);

    for (let x = 3; x < W; x += 19) {
      const n = (x * 17) % 11;
      rect(x, FLOOR_Y + 9 + n, 5, 2, palette.soilLight);
      rect(x + 8, FLOOR_Y + 22 + (n % 7), 3, 2, palette.soilDark);
      if (x % 3 === 0) rect(x + 12, FLOOR_Y + 5, 2, 2, "#9a8056");
    }
    // Quelques brins courts, sans ajouter d'autre décor.
    for (let x = 8; x < W; x += 37) {
      rect(x, FLOOR_Y - 2, 1, 3, "#a0a765");
      rect(x + 2, FLOOR_Y - 1, 1, 2, "#87975a");
    }
    rect(0, H - 3, W, 3, "#332d27");
  }

  function drawCat() {
    const moving = Math.abs(player.vx) > 0.35 && player.grounded;
    const running = Math.abs(player.vx) > 2.2;
    const t = player.animTime;
    const bob = player.grounded ? (moving ? Math.round(Math.sin(t * (running ? 0.34 : 0.23)) * 1.4) : Math.round(Math.sin(t * 0.075) * 0.5)) : 0;
    const stride = moving ? Math.sin(t * (running ? 0.34 : 0.23)) : 0;
    const jumpPose = !player.grounded;
    const x = Math.round(player.x);
    const y = Math.round(player.y + bob);

    ctx.save();
    if (player.facing < 0) {
      ctx.translate(x * 2 + player.w, 0);
      ctx.scale(-1, 1);
      drawCatPixels(0, y, stride, jumpPose, running);
    } else {
      drawCatPixels(x, y, stride, jumpPose, running);
    }
    ctx.restore();
  }

  function drawCatPixels(x, y, stride, airborne, running) {
    const legA = airborne ? -3 : Math.round(stride * (running ? 4 : 2));
    const legB = airborne ? 2 : -legA;
    const armA = airborne ? -3 : Math.round(-stride * 2);
    const tailWave = Math.round(Math.sin(player.animTime * 0.09) * 2);

    // Queue tigrée, silhouette sombre puis mèches brunes.
    rect(x + 1, y + 19 + tailWave, 5, 3, palette.outline);
    rect(x - 1, y + 16 + tailWave, 4, 3, palette.outline);
    rect(x - 3, y + 13 + tailWave, 4, 4, palette.dark);
    rect(x - 4, y + 10 + tailWave, 3, 4, palette.dark);
    rect(x - 3, y + 8 + tailWave, 3, 3, palette.brown);
    rect(x - 1, y + 7 + tailWave, 3, 3, palette.warm);

    // Jambes : deux appuis distincts pour une vraie petite foulée.
    rect(x + 7 + legA, y + 34, 5, 8, palette.outline);
    rect(x + 8 + legA, y + 35, 3, 6, palette.brown);
    rect(x + 5 + legA, y + 41, 8, 3, palette.outline);
    rect(x + 6 + legA, y + 41, 6, 2, palette.dark);
    rect(x + 17 + legB, y + 34, 5, 8, palette.outline);
    rect(x + 18 + legB, y + 35, 3, 6, palette.warm);
    rect(x + 16 + legB, y + 41, 8, 3, palette.outline);
    rect(x + 17 + legB, y + 41, 6, 2, palette.brown);

    // Corps debout, légèrement penché vers l'avant.
    rect(x + 7, y + 17, 15, 19, palette.outline);
    rect(x + 8, y + 18, 13, 16, palette.brown);
    rect(x + 9, y + 20, 10, 12, palette.warm);
    rect(x + 9, y + 30, 10, 4, palette.cream);
    rect(x + 8, y + 22, 3, 9, palette.dark);
    rect(x + 18, y + 20, 3, 10, palette.dark);
    rect(x + 11, y + 18, 2, 4, palette.stripe);
    rect(x + 16, y + 17, 2, 5, palette.stripe);
    rect(x + 13, y + 23, 2, 4, palette.stripe);
    rect(x + 19, y + 26, 2, 3, palette.stripe);

    // Bras visibles, avec petites pattes ivoire.
    rect(x + 5, y + 21 + armA, 4, 11, palette.outline);
    rect(x + 6, y + 22 + armA, 2, 8, palette.warm);
    rect(x + 5, y + 30 + armA, 5, 4, palette.outline);
    rect(x + 6, y + 31 + armA, 3, 2, palette.cream);
    rect(x + 20, y + 21 - armA, 4, 10, palette.outline);
    rect(x + 21, y + 22 - armA, 2, 7, palette.brown);
    rect(x + 20, y + 29 - armA, 5, 4, palette.outline);
    rect(x + 21, y + 30 - armA, 3, 2, palette.cream);

    // Tête, oreilles et joues.
    rect(x + 7, y + 4, 16, 15, palette.outline);
    rect(x + 6, y + 2, 6, 7, palette.outline);
    rect(x + 18, y + 2, 6, 7, palette.outline);
    rect(x + 8, y + 4, 4, 4, palette.brown);
    rect(x + 19, y + 4, 4, 4, palette.warm);
    rect(x + 8, y + 7, 14, 10, palette.brown);
    rect(x + 9, y + 8, 12, 7, palette.warm);
    rect(x + 8, y + 12, 4, 4, palette.cream);
    rect(x + 17, y + 12, 5, 4, palette.cream);
    // Rayures du front et des joues.
    rect(x + 13, y + 7, 2, 4, palette.stripe);
    rect(x + 17, y + 8, 2, 3, palette.stripe);
    rect(x + 7, y + 10, 3, 2, palette.stripe);
    rect(x + 20, y + 11, 3, 2, palette.stripe);
    // Œil, nez et moustaches côté visible.
    rect(x + 17, y + 10, 2, 2, palette.outline);
    rect(x + 17, y + 10, 1, 1, palette.eye);
    rect(x + 20, y + 13, 2, 1, palette.pink);
    rect(x + 19, y + 14, 3, 1, palette.outline);
    rect(x + 21, y + 15, 4, 1, palette.cream);
    rect(x + 22, y + 13, 4, 1, palette.cream);

    // Petite ombre au sol, plus courte lorsque le chat saute.
    ctx.globalAlpha = airborne ? 0.16 : 0.27;
    rect(x + 2, FLOOR_Y + 1, 25, 2, "#243128");
    ctx.globalAlpha = 1;
  }

  function render() {
    // Ciel uni : le premier prototype ne contient volontairement que le chat et le sol.
    rect(0, 0, W, FLOOR_Y, "#9bc6c8");
    rect(0, 0, W, 4, "#a9d0cf");
    drawGround();
    drawCat();
  }

  function update(dt) {
    const left = keys.has("ArrowLeft") || keys.has("KeyA");
    const right = keys.has("ArrowRight") || keys.has("KeyD");
    const direction = (right ? 1 : 0) - (left ? 1 : 0);
    const target = direction * 1.75;
    const acceleration = player.grounded ? 0.42 : 0.24;

    if (direction) {
      player.vx += (target - player.vx) * Math.min(1, acceleration * dt);
      player.facing = direction;
    } else {
      player.vx *= Math.pow(player.grounded ? 0.72 : 0.96, dt);
      if (Math.abs(player.vx) < 0.04) player.vx = 0;
    }

    player.vy += 0.22 * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = clamp(player.x, 5, W - player.w - 5);
    if (player.y + player.h >= FLOOR_Y) {
      player.y = FLOOR_Y - player.h;
      player.vy = 0;
      player.grounded = true;
    } else {
      player.grounded = false;
    }

    player.animTime += dt;
    player.state = !player.grounded ? "jump" : Math.abs(player.vx) > 0.35 ? "walk" : "idle";
    stateLabel.textContent = player.state === "jump" ? "EN L'AIR" : player.state === "walk" ? "EN MARCHE" : "AU REPOS";
  }

  let previous = 0;
  let accumulator = 0;
  const STEP = 1000 / 60;
  function frame(now) {
    if (!previous) previous = now;
    accumulator += Math.min(100, now - previous);
    previous = now;
    while (accumulator >= STEP) {
      update(1);
      accumulator -= STEP;
    }
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "Space", "ArrowUp"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if ((event.code === "Space" || event.code === "ArrowUp") && player.grounded) {
      player.vy = -5.1;
      player.grounded = false;
    }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => keys.clear());

  render();
  requestAnimationFrame(frame);
})();