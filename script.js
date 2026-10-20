
"use strict";

// =====================================
// 1. HTML ELEMENTS
// =====================================

const menuToggle = document.getElementById("menuToggle");
const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");
const backToTop = document.getElementById("backToTop");
const yearElement = document.getElementById("year");

// =====================================
// 2. MOBILE NAVIGATION FUNCTION
// =====================================

function toggleMobileMenu() {
  const isOpen = navbar.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "☰";
}

menuToggle.addEventListener("click", toggleMobileMenu);

// =====================================
// 3. CLOSE MENU AFTER CLICK
// =====================================

function closeMobileMenu() {
  navbar.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    closeMobileMenu();
  });
});

// =====================================
// 4. ACTIVE NAVIGATION LINK
// =====================================

function updateActiveLink() {
  const currentSection = window.location.hash || "#home";

  navLinks.forEach(function (link) {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === currentSection
    );
  });
}

window.addEventListener("hashchange", updateActiveLink);
updateActiveLink();

// =====================================
// 5. CURRENT YEAR FUNCTION
// =====================================

function updateYear() {
  yearElement.textContent = new Date().getFullYear();
}

updateYear();

// =====================================
// 6. BACK TO TOP FUNCTION
// =====================================

function handleScroll() {
  if (window.scrollY > 300) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
}

window.addEventListener("scroll", handleScroll, {
  passive: true
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

backToTop.addEventListener("click", scrollToTop);

// =====================================
// 7. ESCAPE KEY FUNCTION
// =====================================

function handleEscapeKey(event) {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
}

document.addEventListener("keydown", handleEscapeKey);

// =====================================
// 8. IMAGE ERROR HANDLING
// =====================================

function handleImageErrors() {
  const gameImages = document.querySelectorAll(".game-image");

  gameImages.forEach(function (img) {
    img.addEventListener("error", function () {
      img.style.display = "none";
      img.parentElement.style.background =
        "linear-gradient(135deg, #173e85, #07122f)";

      if (!img.parentElement.querySelector(".image-fallback")) {
        const fallback = document.createElement("span");

        fallback.className = "image-fallback";
        fallback.textContent = "🎮";
        fallback.style.cssText =
          "display:grid;place-items:center;min-height:150px;" +
          "font-size:65px;";

        img.parentElement.appendChild(fallback);
      }
    });
  });
}

handleImageErrors();

// =====================================
// 9. WEBSITE READY
// =====================================

console.log("🎮 Sahil's Game Store loaded successfully!");


