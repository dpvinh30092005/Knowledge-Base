// Mobile Menu Toggle
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});

// Theme Switcher
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem("theme");

if (currentTheme) {
  document.documentElement.setAttribute("data-theme", currentTheme);
  if (currentTheme === "dark") {
    toggleSwitch.checked = true;
  }
}

function switchTheme(e) {
  if (e.target.checked) {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
}

toggleSwitch.addEventListener("change", switchTheme, false);

// Dynamic Year
const dateSpan = document.getElementById("datee");
if (dateSpan) {
  dateSpan.textContent = new Date().getFullYear();
}

// Scroll Reveal Animations using GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const revealElements = document.querySelectorAll('.reveal');

revealElements.forEach((el) => {
  gsap.fromTo(el, 
    { autoAlpha: 0, y: 40 }, 
    {
      autoAlpha: 1, 
      y: 0, 
      duration: 0.8, 
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%", // Trigger when the top of the element hits 85% from the top of the viewport
        toggleActions: "play none none none" // Play once
      }
    }
  );
});

// Hero Section Custom Animation Timeline
const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });

heroTimeline
  // 1. Slide in the About Me pill from left
  .from(".hero-title-pill", { x: -100, opacity: 0, duration: 1 }, 0)
  // 2. Slide in the image pill from right
  .from(".hero-img-wrapper", { x: 100, opacity: 0, duration: 1 }, 0.2)
  // 3. Stagger fade up the text paragraphs
  .from(".hero-text p", { y: 20, opacity: 0, stagger: 0.1 }, 0.4)
  // 4. Fade in Contact title
  .from(".contact-title", { y: 20, opacity: 0, duration: 0.8 }, 0.6)
  // 5. Stagger in the contact links
  .from(".contact-grid a", { y: 20, opacity: 0, stagger: 0.1 }, 0.8);
