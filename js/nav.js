/**
 * nav.js — Navigation for Stiner Thrifting
 * Handles hamburger toggle and scroll-spy active link highlighting.
 */

/**
 * Collapse the mobile menu.
 */
function closeMenu() {
  const nav = document.getElementById("main-nav");
  const hamburger = nav && nav.querySelector(".nav__hamburger");
  if (!nav) return;
  nav.classList.remove("nav-open");
  if (hamburger) hamburger.setAttribute("aria-expanded", "false");
}

/**
 * Initialize navigation:
 *  - Hamburger toggle (adds/removes .nav-open on <nav>)
 *  - aria-expanded updates on the hamburger button
 *  - IntersectionObserver scroll-spy to highlight the active link
 */
function initNav() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  const hamburger = nav.querySelector(".nav__hamburger");
  const navLinks = nav.querySelectorAll(".nav__link");

  // ── Hamburger toggle ──────────────────────────────────────
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("nav-open");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Close menu when a nav link is clicked (mobile UX)
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
    });
  });

  // ── Scroll-spy via IntersectionObserver ───────────────────
  // Collect all section IDs referenced by anchor links
  const sectionIds = [];
  navLinks.forEach(function (link) {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      sectionIds.push(href.slice(1));
    }
  });

  if (sectionIds.length === 0) return;

  /**
   * Mark the link matching `id` as active, clear others.
   */
  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      const href = link.getAttribute("href");
      if (href === "#" + id) {
        link.classList.add("nav__link--active");
      } else {
        link.classList.remove("nav__link--active");
      }
    });
  }

  // Track which sections are currently intersecting
  const visibleSections = new Set();

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visibleSections.add(entry.target.id);
        } else {
          visibleSections.delete(entry.target.id);
        }
      });

      // Highlight the first visible section (in DOM order)
      for (let i = 0; i < sectionIds.length; i++) {
        if (visibleSections.has(sectionIds[i])) {
          setActiveLink(sectionIds[i]);
          return;
        }
      }
    },
    {
      // Trigger when a section occupies at least 20% of the viewport
      threshold: 0.2,
    },
  );

  sectionIds.forEach(function (id) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}
