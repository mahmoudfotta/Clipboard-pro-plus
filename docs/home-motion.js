// Homepage motion is progressive: content is visible when scripts, observers,
// or motion preferences prevent the enhancements from running.
(() => {
  if (!document.body.classList.contains("home")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (!("IntersectionObserver" in window)) return;

  const selectors = [
    ".benefit-bar",
    ".platform-copy",
    ".ai-copy",
    ".mac-copy",
    ".resources-heading",
    ".resource-card",
    ".closing-panel > div",
  ];
  const targets = document.querySelectorAll(selectors.join(", "));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -32px 0px", threshold: 0.08 });

  for (const target of targets) {
    target.classList.add("reveal-pending");
    observer.observe(target);
  }

  const chapters = document.querySelectorAll(".ios-section, .ai-section, .mac-section, .resources-section");
  const chapterObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-entered");
      chapterObserver.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -20% 0px", threshold: 0 });
  chapters.forEach((chapter) => chapterObserver.observe(chapter));
})();
