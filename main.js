import './style.css';

// Constants and config
const TOTAL_FRAMES = 240;
const frames = [];
const frameStatus = { loaded: 0 };

// Helper to determine the correct base URL dynamically
// This solves subfolder deployment pathing (like GitHub Pages "/shree-sandwich-web/")
function getBaseUrl() {
  let path = window.location.pathname;
  if (path.endsWith('.html')) {
    path = path.substring(0, path.lastIndexOf('/'));
  }
  if (!path.endsWith('/')) {
    path += '/';
  }
  return path;
}
const BASE_URL = getBaseUrl();

// Select elements
const loader = document.getElementById('loader');
const progress = document.getElementById('loader-progress');
const percentageText = document.getElementById('loader-percentage');
const canvas = document.getElementById('animation-canvas');
const context = canvas.getContext('2d');
const storySection = document.getElementById('story');
const narrationSteps = document.querySelectorAll('.narration-step');
const header = document.querySelector('.app-header');
const navLinks = document.querySelectorAll('.nav-link');
const storefrontImg = document.getElementById('storefront-img');

// Setup Canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Redraw current frame if images are loaded
  const currentFrame = getCurrentFrameIndex();
  if (frames[currentFrame] && frames[currentFrame].complete) {
    drawFrame(currentFrame);
  }
}
window.addEventListener('resize', resizeCanvas);

// Get current active frame index based on scroll position
function getCurrentFrameIndex() {
  const rect = storySection.getBoundingClientRect();
  const sectionHeight = storySection.scrollHeight;
  const viewportHeight = window.innerHeight;
  
  // Calculate how far into the section we have scrolled
  // 0 at top of section, 1 at bottom of section
  const scrollDistance = -rect.top;
  const totalScrollableHeight = sectionHeight - viewportHeight;
  
  if (scrollDistance <= 0) return 0;
  if (scrollDistance >= totalScrollableHeight) return TOTAL_FRAMES - 1;
  
  const scrollFraction = scrollDistance / totalScrollableHeight;
  const frameIndex = Math.floor(scrollFraction * TOTAL_FRAMES);
  return Math.min(TOTAL_FRAMES - 1, Math.max(0, frameIndex));
}

// Draw specific frame image onto the canvas
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;

  context.clearRect(0, 0, canvas.width, canvas.height);

  // Cover image scaling
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (canvasRatio > imgRatio) {
    // Canvas is wider than image aspect ratio -> fit width, crop height
    drawHeight = canvasWidth / imgRatio;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    // Canvas is taller than image aspect ratio -> fit height, crop width
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
  }

  context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Update narration step active states
function updateNarration(frameIndex) {
  narrationSteps.forEach((step) => {
    const start = parseInt(step.getAttribute('data-frame-start'), 10);
    const end = parseInt(step.getAttribute('data-frame-end'), 10);
    const card = step.querySelector('.narration-card');

    if (frameIndex >= start && frameIndex <= end) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Scroll animation updates
function handleScroll() {
  const frameIndex = getCurrentFrameIndex();
  
  // Render frame
  requestAnimationFrame(() => {
    drawFrame(frameIndex);
    updateNarration(frameIndex);
    revealOnScroll();
    updateActiveNav();
  });

  // Header shrink & opacity change
  if (header) {
    if (window.scrollY > 50) {
      header.style.height = '70px';
      header.style.background = 'rgba(13, 13, 17, 0.9)';
      header.style.borderBottomColor = 'rgba(255, 255, 255, 0.08)';
    } else {
      header.style.height = '80px';
      header.style.background = 'transparent';
      header.style.borderBottomColor = 'transparent';
    }
  }
}

// Simple scroll reveal interaction for general text elements
function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal-text');
  const windowHeight = window.innerHeight;
  const elementVisible = 100;
  
  reveals.forEach((reveal) => {
    const elementTop = reveal.getBoundingClientRect().top;
    if (elementTop < windowHeight - elementVisible) {
      reveal.classList.add('visible');
    }
  });
}

// Update active navigation link based on current viewport position
function updateActiveNav() {
  const sections = ['story', 'profile', 'ingredients', 'contact'];
  let currentActive = 'story';

  for (const id of sections) {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      // If the section is currently visible in viewport or near the top
      if (rect.top <= 120 && rect.bottom >= 120) {
        currentActive = id;
        break;
      }
    }
  }

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === `#${currentActive}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Preload all frames
function preloadFrames() {
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `${BASE_URL}frames/ezgif-frame-${frameNum}.jpg`;
      
      img.onload = () => {
        frameStatus.loaded++;
        const pct = Math.floor((frameStatus.loaded / TOTAL_FRAMES) * 100);
        progress.style.width = `${pct}%`;
        percentageText.textContent = `${pct}%`;
        
        if (frameStatus.loaded === TOTAL_FRAMES) {
          resolve();
        }
      };

      // Fallback in case of errors
      img.onerror = () => {
        frameStatus.loaded++;
        if (frameStatus.loaded === TOTAL_FRAMES) {
          resolve();
        }
      };

      frames.push(img);
    }
  });
}

// Initialize Application
async function init() {
  resizeCanvas();
  
  // Set initial header styling
  if (header) {
    header.style.background = 'transparent';
    header.style.borderBottomColor = 'transparent';
  }

  // Bind storefront image src dynamically
  if (storefrontImg) {
    storefrontImg.src = `${BASE_URL}storefront.jpg`;
  }

  // Load assets
  await preloadFrames();
  
  // Hide loader
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 800);

  // Initial draw
  drawFrame(0);
  updateNarration(0);
  revealOnScroll();
  updateActiveNav();
  
  // Listen to scrolling
  window.addEventListener('scroll', handleScroll, { passive: true });
}

init();
