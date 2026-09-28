// Homepage motion is progressive: content is visible when scripts, observers,
// or motion preferences prevent the enhancements from running.
(() => {
  const body = document.body;
  if (!body.classList.contains("home")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  body.classList.add("fx-on");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const wideLayout = window.matchMedia("(min-width: 901px)");

  // Split headings into words that rise in sequence, keeping highlighted
  // spans intact so their colors carry over.
  const splitHeading = (heading) => {
    heading.setAttribute("aria-label", heading.textContent.replace(/\s+/g, " ").trim());
    let index = 0;
    const splitWords = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName !== "BR") splitWords(child);
          continue;
        }
        if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) {
          if (child.nodeType === Node.TEXT_NODE) child.remove();
          continue;
        }
        const fragment = document.createDocumentFragment();
        for (const word of child.textContent.trim().split(/\s+/)) {
          const outer = document.createElement("span");
          outer.className = "fx-word";
          outer.setAttribute("aria-hidden", "true");
          const inner = document.createElement("span");
          inner.style.setProperty("--i", index++);
          inner.textContent = word;
          outer.append(inner);
          fragment.append(outer);
        }
        child.replaceWith(fragment);
      }
    };
    splitWords(heading);
  };
  const title = document.querySelector(".hero-copy h1");
  if (title) splitHeading(title);
  for (const heading of document.querySelectorAll(".platform-copy h2, .ai-copy h2, .mac-copy h2, .resources-heading h2, .closing-panel h2")) {
    splitHeading(heading);
    heading.classList.add("fx-split");
  }

  // A stream of saved clips drifts under the hero.
  const benefitBarAnchor = document.querySelector(".benefit-bar");
  if (benefitBarAnchor) {
    const clips = [
      ["", "Thanks for reaching out! I'll take a look."],
      ["link", "example.com/studio/brand-guide"],
      ["tag", "#replies"],
      ["pin", "My go-to reply"],
      ["", "Launch notes: finish the landing page by Friday"],
      ["tag", "#work"],
      ["link", "maps.apple.com/?q=Coffee"],
      ["", "Let's meet Tuesday at 10."],
      ["pin", "A little progress, every day."],
      ["tag", "#ideas"],
    ];
    const icon = { "": "≡", link: "↗", tag: "#", pin: "★" };
    const stream = document.createElement("div");
    stream.className = "fx-stream";
    stream.setAttribute("aria-hidden", "true");
    for (const offset of [0, 5]) {
      const row = document.createElement("div");
      row.className = "fx-stream-row";
      const ordered = [...clips.slice(offset), ...clips.slice(0, offset)];
      for (const [kind, text] of [...ordered, ...ordered]) {
        const chip = document.createElement("span");
        const mark = document.createElement("i");
        if (kind) mark.className = kind;
        mark.textContent = icon[kind];
        chip.append(mark, text);
        row.append(chip);
      }
      stream.append(row);
    }
    benefitBarAnchor.after(stream);
  }

  // A "copied" toast pops beside the hero phone now and then.
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual) {
    const toast = document.createElement("span");
    toast.className = "fx-toast";
    toast.setAttribute("aria-hidden", "true");
    toast.innerHTML = "<i>✓</i> Saved to Clipboard Pro+";
    heroVisual.append(toast);
  }

  // Reading progress and back-to-top.
  const progress = document.createElement("div");
  progress.className = "fx-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  body.prepend(progress);

  const topButton = document.createElement("button");
  topButton.type = "button";
  topButton.className = "fx-top";
  topButton.setAttribute("aria-label", "Back to top");
  topButton.innerHTML = '<svg viewBox="0 0 50 50" aria-hidden="true"><circle class="ring-track" cx="25" cy="25" r="22"/><circle class="ring-fill" cx="25" cy="25" r="22"/></svg><b aria-hidden="true">↑</b>';
  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".brand")?.focus({ preventScroll: true });
  });
  body.append(topButton);

  // Staggered reveals: each copy block's children (and list items) arrive in turn.
  const groups = [
    ".platform-copy",
    ".ai-copy",
    ".mac-copy",
    ".resources-heading",
    ".resource-grid",
    ".closing-panel > div",
  ];
  const revealTargets = [];
  const benefitBar = document.querySelector(".benefit-bar");
  if (benefitBar) revealTargets.push(benefitBar);
  for (const group of document.querySelectorAll(groups.join(", "))) {
    let delay = 0;
    for (const child of group.children) {
      const items = child.matches("ul, .mac-features") ? [...child.children] : [child];
      for (const item of items) {
        item.style.setProperty("--d", delay++);
        revealTargets.push(item);
      }
    }
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -32px 0px", threshold: 0.08 });
  for (const target of revealTargets) {
    target.classList.add("reveal-pending");
    observer.observe(target);
  }

  // Chapters draw their accent line and ease their device stage in.
  const chapters = document.querySelectorAll(".ios-section, .ai-section, .mac-section, .resources-section");
  const chapterObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-entered");
      chapterObserver.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -20% 0px", threshold: 0 });
  chapters.forEach((chapter) => chapterObserver.observe(chapter));

  // Nav pill follows the section in view, or the link under the pointer.
  const nav = document.querySelector(".site-nav");
  const navLinks = nav ? [...nav.querySelectorAll("a")] : [];
  const spyLinks = navLinks
    .filter((link) => link.hash)
    .map((link) => ({ link, section: document.querySelector(link.hash) }))
    .filter((entry) => entry.section);
  let pill = null;
  let spyLink = null;
  let hoverLink = null;
  const placePill = () => {
    if (!pill) return;
    const link = hoverLink ?? spyLink;
    navLinks.forEach((item) => item.classList.toggle("is-pill-target", item === link));
    if (!link || !wideLayout.matches) { nav.style.setProperty("--pill-o", "0"); return; }
    nav.style.setProperty("--pill-x", `${link.offsetLeft}px`);
    nav.style.setProperty("--pill-w", `${link.offsetWidth}px`);
    nav.style.setProperty("--pill-o", "1");
  };
  if (nav) {
    pill = document.createElement("span");
    pill.className = "fx-pill";
    pill.setAttribute("aria-hidden", "true");
    nav.prepend(pill);
    for (const link of navLinks) {
      link.addEventListener("pointerenter", () => { hoverLink = link; placePill(); });
      link.addEventListener("focus", () => { hoverLink = link; placePill(); });
    }
    nav.addEventListener("pointerleave", () => { hoverLink = null; placePill(); });
    nav.addEventListener("focusout", () => { hoverLink = null; placePill(); });
  }

  // One scroll pass drives progress, header state, scroll-spy, and parallax.
  const header = document.querySelector(".site-header");
  const macSection = document.querySelector(".mac-section");
  const stages = [...document.querySelectorAll(".ios-section, .ai-section, .mac-section")];
  let ticking = false;
  const update = () => {
    ticking = false;
    const scrollTop = window.scrollY;
    const viewport = window.innerHeight;
    const max = document.documentElement.scrollHeight - viewport;
    const ratio = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
    body.style.setProperty("--fx-progress", ratio.toFixed(4));
    header?.classList.toggle("is-scrolled", scrollTop > 24);
    topButton.classList.toggle("is-visible", scrollTop > viewport * 0.9);

    for (const stage of stages) {
      const rect = stage.getBoundingClientRect();
      if (rect.bottom < -viewport || rect.top > viewport * 2) continue;
      const offset = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      stage.style.setProperty("--fx-par", Math.max(-1, Math.min(1, offset)).toFixed(3));
    }

    if (macSection) {
      const top = macSection.getBoundingClientRect().top;
      const open = Math.min(1, Math.max(0, (viewport - top) / (viewport * 0.7)));
      macSection.style.setProperty("--fx-open", open.toFixed(3));
    }

    let current = null;
    for (const entry of spyLinks) {
      const rect = entry.section.getBoundingClientRect();
      if (rect.top <= viewport * 0.4 && rect.bottom > viewport * 0.4) current = entry.link;
    }
    if (current !== spyLink) { spyLink = current; placePill(); }
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => { placePill(); requestUpdate(); });
  update();

  if (!finePointer) return;

  // Hero stage tilts toward the pointer, with devices at different depths.
  const hero = document.querySelector(".hero-section");
  if (hero && heroVisual) {
    const glow = document.createElement("span");
    glow.className = "fx-glow";
    glow.setAttribute("aria-hidden", "true");
    hero.prepend(glow);
    hero.addEventListener("pointermove", (event) => {
      const box = hero.getBoundingClientRect();
      hero.style.setProperty("--gx", `${(event.clientX - box.left).toFixed(0)}px`);
      hero.style.setProperty("--gy", `${(event.clientY - box.top).toFixed(0)}px`);
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
      const y = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
      heroVisual.style.setProperty("--tx", Math.max(-1, Math.min(1, x * 2)).toFixed(3));
      heroVisual.style.setProperty("--ty", Math.max(-1, Math.min(1, y * 2)).toFixed(3));
    });
    hero.addEventListener("pointerleave", () => {
      heroVisual.style.setProperty("--tx", "0");
      heroVisual.style.setProperty("--ty", "0");
    });
  }

  // Resource cards: spotlight and tilt that track the pointer.
  for (const card of document.querySelectorAll(".resource-card")) {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--sx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--sy", `${(y * 100).toFixed(1)}%`);
      card.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }

  // Call-to-action buttons lean slightly toward the pointer.
  for (const button of document.querySelectorAll(".home-button, .nav-cta")) {
    button.classList.add("fx-magnet");
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty("--mx", `${((event.clientX - rect.left - rect.width / 2) * 0.18).toFixed(1)}px`);
      button.style.setProperty("--my", `${((event.clientY - rect.top - rect.height / 2) * 0.3).toFixed(1)}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--mx", "0px");
      button.style.setProperty("--my", "0px");
    });
  }
})();
