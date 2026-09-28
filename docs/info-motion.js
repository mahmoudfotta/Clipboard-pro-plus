// Support and policy page enhancements. The pages are complete without this
// script; it adds section cards, scroll progress, a tracking table of
// contents, and motion that respects prefers-reduced-motion.
(() => {
  const body = document.body;
  if (!body.classList.contains("info")) return;
  document.documentElement.classList.add("info-js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactLayout = window.matchMedia("(max-width: 700px)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  // The section list starts collapsed on phones.
  const sectionList = document.querySelector(".info-toc-details");
  const syncSectionList = () => { if (sectionList) sectionList.open = !compactLayout.matches; };
  syncSectionList();
  compactLayout.addEventListener("change", syncSectionList);

  // Group each English h2 and its content into a card. The Arabic block is
  // already its own <section> and stays as-is.
  const article = document.querySelector(".info-article");
  const sections = [];
  if (article) {
    let current = null;
    for (const node of [...article.children]) {
      if (node.tagName === "H2") {
        current = document.createElement("div");
        current.className = "info-section";
        article.insertBefore(current, node);
        sections.push(current);
      } else if (node.tagName === "SECTION") {
        current = null;
        continue;
      } else if (!current && node.tagName === "P") {
        node.classList.add("info-lede");
        continue;
      }
      if (current) current.appendChild(node);
    }
  }

  // Heading permalinks copy the section address.
  for (const heading of document.querySelectorAll(".info-section > h2[id]")) {
    const anchor = document.createElement("a");
    anchor.className = "info-anchor";
    anchor.href = `#${heading.id}`;
    anchor.setAttribute("aria-label", `Copy link to ${heading.textContent}`);
    anchor.textContent = "#";
    anchor.addEventListener("click", async (event) => {
      if (!navigator.clipboard) return;
      event.preventDefault();
      const url = `${location.origin}${location.pathname}#${heading.id}`;
      history.replaceState(null, "", `#${heading.id}`);
      try {
        await navigator.clipboard.writeText(url);
        anchor.textContent = "✓";
        anchor.classList.add("is-copied");
        setTimeout(() => { anchor.textContent = "#"; anchor.classList.remove("is-copied"); }, 1400);
      } catch { location.hash = heading.id; }
    });
    heading.appendChild(anchor);
  }

  // Reading progress bar, TOC meter, and back-to-top button.
  const progress = document.createElement("div");
  progress.className = "info-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  body.prepend(progress);

  const tocNav = document.querySelector(".info-toc nav");
  if (tocNav) {
    const meter = document.createElement("span");
    meter.className = "info-toc-meter";
    meter.setAttribute("aria-hidden", "true");
    meter.innerHTML = "<span></span>";
    tocNav.before(meter);
  }

  const topButton = document.createElement("button");
  topButton.type = "button";
  topButton.className = "info-top";
  topButton.setAttribute("aria-label", "Back to top");
  topButton.innerHTML = '<svg viewBox="0 0 50 50" aria-hidden="true"><circle class="ring-track" cx="25" cy="25" r="22"/><circle class="ring-fill" cx="25" cy="25" r="22"/></svg><b aria-hidden="true">↑</b>';
  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    document.querySelector(".info-brand")?.focus({ preventScroll: true });
  });
  body.append(topButton);

  // Nav pill that rests on the current page and follows the pointer.
  const nav = document.querySelector(".info-nav");
  const navLinks = nav ? [...nav.querySelectorAll("a")] : [];
  const currentLink = navLinks.find((link) => link.getAttribute("aria-current") === "page");
  let pill = null;
  const movePill = (link) => {
    if (!pill || compactLayout.matches) return;
    navLinks.forEach((item) => item.classList.toggle("is-pill-target", item === link));
    if (!link) { nav.style.setProperty("--pill-o", "0"); return; }
    nav.style.setProperty("--pill-x", `${link.offsetLeft}px`);
    nav.style.setProperty("--pill-w", `${link.offsetWidth}px`);
    nav.style.setProperty("--pill-o", "1");
    nav.style.setProperty("--pill-current", link === currentLink ? "1" : "0");
  };
  if (nav) {
    pill = document.createElement("span");
    pill.className = "info-nav-pill";
    pill.setAttribute("aria-hidden", "true");
    nav.prepend(pill);
    for (const link of navLinks) {
      link.addEventListener("pointerenter", () => movePill(link));
      link.addEventListener("focus", () => movePill(link));
    }
    nav.addEventListener("pointerleave", () => movePill(currentLink));
    nav.addEventListener("focusout", () => movePill(currentLink));
    // Place the pill without animating on first paint.
    pill.style.transition = "none";
    movePill(currentLink);
    requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ""; }));
    document.fonts?.ready.then(() => movePill(currentLink));
  }

  // Table of contents marker tracks the section in view.
  const tocLinks = tocNav ? [...tocNav.querySelectorAll('a[href^="#"]')] : [];
  const tocTargets = tocLinks
    .map((link) => ({ link, target: document.getElementById(link.hash.slice(1)) }))
    .filter((entry) => entry.target);
  let marker = null;
  if (tocNav) {
    marker = document.createElement("span");
    marker.className = "info-toc-marker";
    marker.setAttribute("aria-hidden", "true");
    tocNav.prepend(marker);
  }
  let activeLink = null;
  const setActive = (link) => {
    if (link === activeLink) return;
    activeLink = link;
    tocLinks.forEach((item) => item.classList.toggle("is-active", item === link));
    if (link) link.setAttribute("aria-current", "location");
    tocLinks.forEach((item) => { if (item !== link) item.removeAttribute("aria-current"); });
    for (const section of sections) {
      const heading = section.querySelector("h2");
      section.classList.toggle("is-active", Boolean(link && heading && `#${heading.id}` === link.hash));
    }
    if (!marker) return;
    if (!link || compactLayout.matches) { tocNav.style.setProperty("--toc-o", "0"); return; }
    tocNav.style.setProperty("--toc-y", `${link.offsetTop}px`);
    tocNav.style.setProperty("--toc-h", `${link.offsetHeight}px`);
    tocNav.style.setProperty("--toc-o", "1");
  };

  const header = document.querySelector(".info-header");
  let ticking = false;
  const update = () => {
    ticking = false;
    const scrollTop = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
    body.style.setProperty("--info-progress", ratio.toFixed(4));
    header?.classList.toggle("is-scrolled", scrollTop > 12);
    topButton.classList.toggle("is-visible", scrollTop > window.innerHeight * 0.8);

    const line = window.innerHeight * 0.32;
    let candidate = null;
    for (const entry of tocTargets) {
      if (entry.target.getBoundingClientRect().top - line <= 0) candidate = entry.link;
    }
    if (ratio > 0.995 && tocTargets.length) candidate = tocTargets[tocTargets.length - 1].link;
    setActive(candidate);
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    activeLink = null;
    movePill(currentLink);
    requestUpdate();
  });
  update();

  if (reduceMotion) return;

  // Split the hero title into words that rise in sequence.
  const title = document.querySelector(".info-hero h1");
  if (title && !title.children.length) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute("aria-label", title.textContent.trim());
    title.textContent = "";
    words.forEach((word, index) => {
      const outer = document.createElement("span");
      outer.className = "info-word";
      outer.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.style.setProperty("--i", index);
      inner.textContent = word;
      outer.append(inner);
      title.append(outer, index < words.length - 1 ? " " : "");
    });
  }

  // Gentle parallax on the hero illustration.
  const hero = document.querySelector(".info-hero");
  if (hero && finePointer.matches) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--px", (((event.clientX - rect.left) / rect.width) - 0.5).toFixed(3));
      hero.style.setProperty("--py", (((event.clientY - rect.top) / rect.height) - 0.5).toFixed(3));
    });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--px", "0");
      hero.style.setProperty("--py", "0");
    });
  }

  // Reveal cards as they enter the viewport. Anything already on screen or
  // targeted by the URL hash shows immediately.
  if (!("IntersectionObserver" in window)) return;
  const revealTargets = document.querySelectorAll(".info-section, .info-lede, .info-article > section[lang]");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  for (const target of revealTargets) {
    const rect = target.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) continue;
    target.classList.add("info-reveal");
    observer.observe(target);
  }
  // Jumping from the TOC should never land on a hidden card.
  window.addEventListener("hashchange", () => {
    const target = document.getElementById(location.hash.slice(1));
    const card = target?.closest(".info-reveal") ?? (target?.classList.contains("info-reveal") ? target : null);
    card?.classList.add("is-revealed");
  });
  for (const { link, target } of tocTargets) {
    link.addEventListener("click", () => {
      (target.closest(".info-reveal") ?? target).classList.add("is-revealed");
    });
  }
})();
