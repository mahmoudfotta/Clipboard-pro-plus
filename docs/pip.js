// Pip, the Clipboard Pro+ buddy, animated on the homepage. A port of the app's
// PipMascotView.swift (same geometry, colors, poses and timing), drawn as SVG.
// Any element with data-pip="happy" | "waitingToCopy" | "waiting" becomes a Pip.
// Clicking Pip plays a cheer. With reduced motion Pip holds a still pose.
(() => {
  const hosts = document.querySelectorAll("[data-pip]");
  if (!hosts.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const C = {
    ink: "#1B0F3A", shadowInk: "#160D33", violet: "#5A2BE8", violetDeep: "#3F14BE",
    lime: "#D4FF3A", limeDeep: "#A8D400", pink: "#FF7AB6", lilac: "#E2D7FF",
    paper: "#FFFDF6", mouth: "#3B0F3F", star: "#FFD23F",
  };
  const SL = [-178, 62], SR = [178, 62];
  const CHEER_LENGTH = 1.4;

  // ---- Poses (seconds in, pose out), mirroring PipPose in the app. ----------
  const basePose = () => ({
    eyes: "happy", mouth: "grin", blink: 0, look: [0, 0], blush: 0.9, hop: 0, squash: 1, tilt: 0,
    armL: 150, armR: -150, sway: 0, spin: 0, glow: 0.35, lines: 0, clip: null, burst: null,
  });
  const applyHop = (pose, phase, height) => {
    if (phase < 0.72) {
      const air = phase / 0.72;
      pose.hop = Math.sin(air * Math.PI) * height;
      pose.squash = 1 + Math.sin(air * Math.PI) * 0.05;
    } else {
      pose.squash = 1 - Math.sin(((phase - 0.72) / 0.28) * Math.PI) * 0.13;
    }
  };

  const happy = (t) => {
    const pose = basePose();
    if (t == null) return pose;
    const hopLength = 0.9, intro = hopLength * 3;
    let phase = null;
    if (t < intro) phase = (t % hopLength) / hopLength;
    else if ((t - intro) % 3.2 < hopLength) phase = ((t - intro) % 3.2) / hopLength;
    if (phase != null) applyHop(pose, phase, 46);
    const wave = Math.sin(t * 2 * Math.PI * (phase == null ? 0.9 : 1.8));
    pose.armL = 150 + 16 * wave;
    pose.armR = -150 + 16 * wave;
    pose.tilt = 4 * Math.sin(t * Math.PI);
    pose.sway = 12 * Math.sin(t * 2 * Math.PI * 0.8) - pose.hop * 0.12;
    pose.spin = t * 70;
    pose.glow = 0.35 + 0.25 * Math.sin(t * 3.2);
    return pose;
  };

  const waiting = (t) => {
    const pose = { ...basePose(), eyes: "open", mouth: "smile", blush: 0.7, armL: 40, armR: -40, glow: 0.2, look: [0, 8] };
    if (t == null) return pose;
    const u = t % 2.2;
    pose.look = [13 * Math.max(-1, Math.min(1, Math.sin((u * 2 * Math.PI) / 1.1) * 3)), 8];
    pose.blink = Math.max(0, 1 - Math.abs(u - 1.28) / 0.07);
    pose.spin = t * 40;
    pose.sway = 6 * Math.sin(t * 2 * Math.PI * 0.6);
    pose.squash = 1 + 0.015 * Math.sin(t * 2 * Math.PI * 0.9);
    pose.armL = 40 + 4 * Math.sin(t * 3);
    pose.armR = -40 - 4 * Math.sin(t * 3);
    return pose;
  };

  const WAIT_CYCLE = 4.6, WAIT_IMPACT = 2.35;
  const waitingToCopy = (t) => {
    const pose = waiting(t);
    if (t == null) return pose;
    const u = t % WAIT_CYCLE;
    if (u >= 2.1 && u < WAIT_IMPACT) {
      const rise = (u - 2.1) / (WAIT_IMPACT - 2.1);
      Object.assign(pose, { eyes: "wide", mouth: "o", look: [0, -12], armL: 40 + 70 * rise, armR: -40 - 70 * rise });
    } else if (u >= WAIT_IMPACT) {
      const since = u - WAIT_IMPACT;
      const settle = Math.max(0, Math.min(1, (u - 3.7) / 0.5));
      pose.eyes = u < 3.9 ? "happy" : "open";
      pose.mouth = u < 3.9 ? "grin" : "smile";
      pose.blush = u < 3.9 ? 1 : 0.7;
      pose.squash = 1 - 0.14 * Math.exp(-since / 0.13) * Math.cos(since / 0.07);
      if (since > 0.25 && since < 0.85) applyHop(pose, (since - 0.25) / 0.6, 30);
      const cheer = 150 + 14 * Math.sin(since * 14);
      pose.armL = cheer + (40 - cheer) * settle;
      pose.armR = -cheer + (-40 + cheer) * settle;
      pose.lines = Math.max(0, 1 - since / 1.8);
      pose.glow = 0.2 + 1.2 * Math.exp(-since / 0.35);
      pose.sway += 30 * Math.exp(-since / 0.3) * Math.sin(since * 18);
      if (since < 0.6) pose.burst = since / 0.6;
    }
    if (u >= 1.6 && u < WAIT_IMPACT + 0.14) {
      if (u < WAIT_IMPACT) {
        const fall = (u - 1.6) / (WAIT_IMPACT - 1.6);
        pose.clip = { x: 0, y: -600 + 560 * fall * fall, scale: 1, rotation: -6, opacity: Math.min(1, (u - 1.6) / 0.15) };
      } else {
        const absorb = (u - WAIT_IMPACT) / 0.14, scale = 1 - 0.8 * absorb;
        pose.clip = { x: 0, y: -40, scale, rotation: -6 * scale, opacity: 1 - absorb };
      }
    }
    return pose;
  };

  const cheer = (since) => {
    const pose = { ...basePose(), blush: 1, lines: 0.8 };
    const settle = Math.max(0, Math.min(1, (since - 1.05) / 0.35));
    if (since < 0.7) applyHop(pose, since / 0.7, 40);
    const arms = 150 + 14 * Math.sin(since * 14);
    pose.armL = arms + (40 - arms) * settle;
    pose.armR = -arms + (-40 + arms) * settle;
    pose.lines = Math.max(0, 1 - since / CHEER_LENGTH);
    pose.glow = 0.2 + 1.2 * Math.exp(-since / 0.35);
    pose.sway = 30 * Math.exp(-since / 0.3) * Math.sin(since * 18);
    pose.spin = since * 200;
    if (since < 0.6) pose.burst = since / 0.6;
    return pose;
  };

  const scenes = { happy, waiting, waitingToCopy };

  // ---- Drawing, mirroring PipRenderer. -------------------------------------
  const f = (n) => Math.round(n * 10) / 10;
  const sparkle = (r, k) => {
    const c = r * k;
    return `M0 ${f(-r)} Q${f(c)} ${f(-c)} ${f(r)} 0 Q${f(c)} ${f(c)} 0 ${f(r)} Q${f(-c)} ${f(c)} ${f(-r)} 0 Q${f(-c)} ${f(-c)} 0 ${f(-r)}Z`;
  };
  const armTarget = (sh, deg) => {
    const a = (deg * Math.PI) / 180;
    return [sh[0] - Math.sin(a) * 92, sh[1] + Math.cos(a) * 92];
  };

  const eye = (pose, cx, side) => {
    const y = 8, st = `stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    if (pose.eyes === "happy") return `<path d="M${cx - 24} ${y + 8} Q${cx} ${y - 22} ${cx + 24} ${y + 8}" ${st}/>`;
    if (pose.eyes === "squint") return `<path d="M${cx - 18 * side} ${y - 16} L${cx + 14 * side} ${y} L${cx - 18 * side} ${y + 16}" ${st}/>`;
    const wide = pose.eyes === "wide" ? 1.22 : 1;
    const lx = Math.max(-14, Math.min(14, pose.look[0])), ly = Math.max(-12, Math.min(12, pose.look[1]));
    const ex = cx + lx, ey = y + ly, rx = 31 * wide, ry = Math.max(3, 34 * wide * (1 - pose.blink * 0.94) * 1.1);
    let out = `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(rx)}" ry="${f(ry)}" fill="${C.ink}"/>`;
    if (pose.blink < 0.6) {
      out += `<circle cx="${f(ex + 10 * wide)}" cy="${f(ey - 14 * wide * (1 - pose.blink))}" r="${f(12 * wide)}" fill="#fff"/>`;
      out += `<circle cx="${f(ex - 9 * wide)}" cy="${f(ey + 12 * wide * (1 - pose.blink))}" r="${f(4.5 * wide)}" fill="#fff" opacity=".9"/>`;
    }
    return out;
  };

  const openMouth = (w, d) => {
    const top = 56;
    const tongueW = w * 0.5, tongueH = Math.min(9, d * 0.28);
    return `<path d="M${-w} ${top} Q0 ${top + 5} ${w} ${top} Q${w - 2} ${top + d} 0 ${top + d + 3} Q${-w + 2} ${top + d} ${-w} ${top}Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>` +
      `<ellipse cx="0" cy="${f(top + d - 5)}" rx="${f(tongueW)}" ry="${f(tongueH)}" fill="${C.pink}"/>`;
  };
  const mouth = (pose) => {
    const st = `stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    switch (pose.mouth) {
      case "o": return `<ellipse cx="0" cy="66" rx="11" ry="14" fill="${C.mouth}" stroke="${C.ink}" stroke-width="4"/>`;
      case "grin": return openMouth(32, 38);
      case "open": return openMouth(23.6, 22.4);
      default: return `<path d="M-19 58 Q0 76 19 58" ${st}/>`;
    }
  };

  const silhouette = (pose, cut, hands, tip, ctrl, id) => {
    const o = cut ? 26 : 0, col = (c) => (cut ? "#fff" : c);
    const st = cut ? `stroke="#fff" stroke-width="${o}" stroke-linejoin="round"` : "";
    let s = "";
    for (const x of [-64, 64]) s += `<ellipse cx="${x}" cy="240" rx="${50 + o / 2}" ry="${28 + o / 2}" fill="${col(C.violetDeep)}"/>`;
    for (const [sh, h] of [[SL, hands[0]], [SR, hands[1]]]) {
      s += `<line x1="${sh[0]}" y1="${sh[1]}" x2="${f(h[0])}" y2="${f(h[1])}" stroke="${col(C.violetDeep)}" stroke-width="${42 + o}" stroke-linecap="round"/>`;
      s += `<circle cx="${f(h[0])}" cy="${f(h[1])}" r="${25 + o / 2}" fill="${col(C.violetDeep)}"/>`;
    }
    s += `<path d="M0 -240 Q${f(ctrl[0])} ${f(ctrl[1])} ${f(tip[0])} ${f(tip[1])}" stroke="${col(C.violetDeep)}" stroke-width="${12 + o}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="${sparkle(38 + o * 0.6, 0.24)}" transform="translate(${f(tip[0])} ${f(tip[1])}) rotate(${f(pose.spin + pose.sway * 0.6)})" fill="${col(C.lime)}" ${st}/>`;
    s += `<rect x="-192" y="-178" width="384" height="394" rx="124" fill="${cut ? "#fff" : `url(#${id}-board)`}" ${st}/>`;
    s += `<circle cx="0" cy="-218" r="26" fill="none" stroke="${col(C.limeDeep)}" stroke-width="${16 + o}"/>`;
    s += `<rect x="-80" y="-210" width="160" height="66" rx="30" fill="${cut ? "#fff" : `url(#${id}-clip)`}" ${st}/>`;
    return s;
  };

  const burst = (progress) => {
    let s = "";
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.42, d = 180 + 150 * progress;
      const r = 26 * (1 - progress * 0.6);
      s += `<path d="${sparkle(r, 0.22)}" transform="translate(${f(Math.cos(a) * d)} ${f(-20 + Math.sin(a) * d)}) rotate(${f(progress * 115)})" fill="${i % 2 ? "#fff" : C.lime}" stroke="#fff" stroke-width="8" stroke-linejoin="round" opacity="${f(1 - progress)}" paint-order="stroke"/>`;
    }
    return s;
  };

  const clipCard = (clip, id) =>
    `<g opacity="${f(clip.opacity)}" transform="translate(${f(clip.x)} ${f(clip.y)}) scale(${f(clip.scale)}) rotate(${f(clip.rotation)})">
      <g filter="url(#${id}-shadow)"><rect x="-180" y="-55" width="360" height="110" rx="34" fill="#fff" stroke="#fff" stroke-width="18"/></g>
      <rect x="-152" y="-34" width="68" height="68" rx="20" fill="#EFE8FF"/>
      <rect x="-134" y="-18" width="32" height="40" rx="6" fill="${C.violet}"/>
      <rect x="-126" y="-24" width="16" height="10" rx="4" fill="${C.lime}"/>
      <rect x="-64" y="-24" width="190" height="20" rx="10" fill="${C.ink}"/>
      <rect x="-64" y="10" width="130" height="16" rx="8" fill="#6E6887" opacity=".5"/>
    </g>`;

  const draw = (pose, id) => {
    const lift = 1 - pose.hop / 120;
    const hands = [armTarget(SL, pose.armL), armTarget(SR, pose.armR)];
    const sw = (pose.sway * Math.PI) / 180, stalk = 96;
    const tip = [Math.sin(sw) * stalk, -244 - Math.cos(sw) * stalk];
    const ctrl = [-Math.sin(sw) * 18, -244 - stalk * 0.55];
    const glow = Math.min(1, pose.glow), glowR = 60 + 60 * pose.glow;
    const lineColor = pose.lines > 0 ? C.limeDeep : C.lilac;
    const lineOpacity = pose.lines > 0 ? 0.35 + 0.65 * pose.lines : 1;
    const shadowW = 190 * (2 - pose.squash) * lift;
    return `<defs>
        <linearGradient id="${id}-board" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#7E5BFF"/><stop offset=".55" stop-color="${C.violet}"/><stop offset="1" stop-color="#4A1CD6"/></linearGradient>
        <linearGradient id="${id}-clip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBFF8A"/><stop offset="1" stop-color="#B6E61A"/></linearGradient>
        <radialGradient id="${id}-glow"><stop offset="0" stop-color="#F4FFB8" stop-opacity=".95"/><stop offset=".45" stop-color="${C.lime}" stop-opacity=".45"/><stop offset="1" stop-color="${C.lime}" stop-opacity="0"/></radialGradient>
        <filter id="${id}-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="${C.shadowInk}" flood-opacity=".32"/></filter>
      </defs>
      <ellipse cx="0" cy="292" rx="${f(shadowW)}" ry="22" fill="${C.shadowInk}" opacity="${f(0.14 * lift * 100) / 100}"/>
      <g transform="translate(0 ${f(272 - pose.hop)}) rotate(${f(pose.tilt)}) scale(${f((2 - pose.squash) * 1000) / 1000} ${f(pose.squash * 1000) / 1000}) translate(0 -272)">
        <circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="${f(glowR)}" fill="url(#${id}-glow)" opacity="${f(glow * 100) / 100}"/>
        <g filter="url(#${id}-shadow)">${silhouette(pose, true, hands, tip, ctrl, id)}</g>
        ${silhouette(pose, false, hands, tip, ctrl, id)}
        <rect x="-150" y="-166" width="300" height="24" rx="12" fill="#fff" opacity=".12"/>
        <rect x="-60" y="-200" width="96" height="12" rx="6" fill="#fff" opacity=".6"/>
        <rect x="-162" y="-138" width="324" height="326" rx="96" fill="${C.paper}"/>
        <rect x="-120" y="-138" width="240" height="26" rx="13" fill="${C.lilac}" opacity=".45"/>
        <line x1="-84" y1="132" x2="84" y2="132" stroke="${lineColor}" stroke-opacity="${f(lineOpacity * 100) / 100}" stroke-width="9" stroke-linecap="round"/>
        <line x1="-84" y1="158" x2="30" y2="158" stroke="${lineColor}" stroke-opacity="${f(lineOpacity * 100) / 100}" stroke-width="9" stroke-linecap="round"/>
        ${eye(pose, -70, -1)}${eye(pose, 70, 1)}
        <ellipse cx="-116" cy="50" rx="27" ry="14" fill="${C.pink}" opacity="${f(pose.blush * 75) / 100}"/>
        <ellipse cx="116" cy="50" rx="27" ry="14" fill="${C.pink}" opacity="${f(pose.blush * 75) / 100}"/>
        ${mouth(pose)}
        <path d="M-172 -70 Q-172 -160 -100 -168 L-50 -168 Q-138 -140 -154 -20 Z" fill="#fff" opacity=".24"/>
        ${pose.burst != null ? burst(pose.burst) : ""}
      </g>
      ${pose.clip ? clipCard(pose.clip, id) : ""}`;
  };

  // ---- Mounting and the frame loop. ----------------------------------------
  const pips = [];
  hosts.forEach((host, index) => {
    const id = `pip${index}`;
    const scene = scenes[host.dataset.pip] ?? happy;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-380 -460 760 760");
    svg.setAttribute("aria-hidden", "true");
    svg.style.overflow = "visible";
    host.append(svg);
    const pip = { host, svg, id, scene, start: performance.now(), cheerAt: null, visible: true, last: 0 };
    pips.push(pip);
    if (scene === waitingToCopy && !reduceMotion) host.parentElement?.classList.add("has-pip");

    host.addEventListener("click", () => { pip.cheerAt = performance.now(); if (reduceMotion) render(pip, performance.now()); });
    host.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); host.click(); }
    });
  });

  const render = (pip, now) => {
    let pose;
    const cheerSince = pip.cheerAt == null ? null : (now - pip.cheerAt) / 1000;
    if (cheerSince != null && cheerSince < CHEER_LENGTH) pose = reduceMotion ? cheer(CHEER_LENGTH) : cheer(cheerSince);
    else {
      pip.cheerAt = null;
      pose = pip.scene(reduceMotion ? null : (now - pip.start) / 1000);
    }
    pip.svg.innerHTML = draw(pose, pip.id);
  };

  // Tell the page when Pip catches a clip, so the "saved" toast can sync up.
  const syncCatch = (pip, now) => {
    if (pip.scene !== waitingToCopy) return;
    const u = ((now - pip.start) / 1000) % WAIT_CYCLE;
    const caught = u >= WAIT_IMPACT && u < WAIT_IMPACT + 1.4;
    if (caught === pip.caught) return;
    pip.caught = caught;
    // Set on the parent so page styles avoid :has(), which would re-match on every redraw.
    pip.host.classList.toggle("is-caught", caught);
    pip.host.parentElement?.classList.toggle("pip-caught", caught);
  };

  pips.forEach((pip) => render(pip, performance.now()));
  if (reduceMotion) return;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const pip = pips.find((item) => item.host === entry.target);
        if (pip) pip.visible = entry.isIntersecting;
      }
    });
    pips.forEach((pip) => observer.observe(pip.host));
  }

  // About 40 fps is plenty for a mascot and keeps the page light.
  const frame = (now) => {
    for (const pip of pips) {
      if (!pip.visible || document.hidden || now - pip.last < 24) continue;
      pip.last = now;
      render(pip, now);
      syncCatch(pip, now);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
