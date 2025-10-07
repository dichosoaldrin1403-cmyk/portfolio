// direction-aware rotated-layout detector for your site

// friendly labels
const sectionNames = {
  one: "CONTACT ME",
  two: "GRAPHICS DESIGN",
  three: "GAME DEVELOPMENT",
  four: "WEB DEVELOPMENT"
};

const wrapper = document.querySelector('.outer-wrapper'); // your vertical scroller (rotated layout)
const slides = Array.from(document.querySelectorAll('.slide'));
const navLinkEls = Array.from(document.querySelectorAll('.navcontent'));
const marqueeSpans = Array.from(document.querySelectorAll('.marquee span'));

if (!wrapper) {
  console.error('No .outer-wrapper found — detection needs the wrapper element.');
}

let currentSection = null;
let lastScrollPos = wrapper ? wrapper.scrollTop : 0;
let ticking = false;

// layout cache
let widths = [];
let prefix = []; // prefix[i] = start position (accumulated width) of slide i

function rebuildLayoutCache() {
  widths = slides.map(s => s.offsetWidth || s.clientWidth || 0);
  prefix = [];
  let acc = 0;
  widths.forEach((w, i) => {
    prefix[i] = acc;
    acc += w;
  });
}
rebuildLayoutCache();

// helpers: marquee fade & nav
function updateMarqueeText(text) {
  marqueeSpans.forEach(span => {
    if (span.textContent !== text) {
      span.classList.add('fade-out');
      setTimeout(() => {
        span.textContent = text;
        span.classList.remove('fade-out');
        span.classList.add('fade-in');
        setTimeout(() => span.classList.remove('fade-in'), 1000);
      }, 500);
    }
  });
}

function setActiveNav(id) {
  navLinkEls.forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href.includes(`#${id}`));
  });
}

function applySection(id) {
  if (!id || id === currentSection) return;
  currentSection = id;
  const label = sectionNames[id] || id.toUpperCase();
  console.log(`Current slide: ${label}`);
  updateMarqueeText(label);
  setActiveNav(id);
}

// direction-aware detection (uses scrollTop as horizontal offset)
function detectSection() {
  if (!wrapper) return;
  const scrollPos = wrapper.scrollTop;
  const movingRight = scrollPos >= lastScrollPos;
  lastScrollPos = scrollPos;

  // thresholds
  const enterThresh = 0.10; // slide considered entered ~10% from its left edge
  const fallbackIndex = 0;
  let activeIndex = fallbackIndex;

  if (movingRight) {
    // scan left→right and pick first slide whose 'end' hasn't been passed yet
    for (let i = 0; i < slides.length; i++) {
      const w = widths[i] || 0;
      const start = prefix[i] - w * enterThresh;
      const end   = prefix[i] + w * (1 - enterThresh);
      if (scrollPos < end) { activeIndex = i; break; }
      if (i === slides.length - 1) activeIndex = i;
    }
  } else {
    // moving left: scan right→left and pick first slide whose 'start' has been reached
    for (let i = slides.length - 1; i >= 0; i--) {
      const w = widths[i] || 0;
      const start = prefix[i] - w * enterThresh;
      if (scrollPos >= start) { activeIndex = i; break; }
      if (i === 0) activeIndex = 0;
    }
  }

  const id = slides[activeIndex]?.id;
  if (id) applySection(id);
}

// RAF-throttled scroll handler
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      detectSection();
      ticking = false;
    });
  }
}

// wire events
if (wrapper) {
  wrapper.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    rebuildLayoutCache();
    detectSection(); // re-evaluate after layout changes
  });
  window.addEventListener('load', () => {
    rebuildLayoutCache();
    detectSection();
  });
} else {
  // fallback to window scrolling (shouldn't be needed in your layout)
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    rebuildLayoutCache();
    detectSection();
  });
  window.addEventListener('load', detectSection);
}

// --- Sticky title updater ---
const stickyTitle = document.querySelector('.stickytitle');

// Friendly subsection names
const subsectionNames = {
  posters: "Posters",
  announcements: "Announcements",
  leaderboards: "Rankings",
  logos: "Logos",
  stickers: "Stickers",
  magazines: "Magazine Pages",
  banners: "Cover Banners / Headers"
};


// Detect both main and subsection elements
const subsections = Array.from(
  document.querySelectorAll('.slide [id]')
).filter(el => !el.classList.contains('slide')); // exclude the main slide ids

function updateStickyTitle(mainId, subId = null) {
  const mainName = sectionNames[mainId] || mainId.toUpperCase();
  const subName = subId
    ? ` - ${subsectionNames[subId] || subId.replace(/[-_]/g, ' ').toUpperCase()}`
    : "";
  stickyTitle.textContent = mainName + subName;
}


// Track the closest subsection visible inside the current slide
function detectSubsection(mainSlide) {
  let closest = null;
  let closestDist = Infinity;
  subsections.forEach(sub => {
    if (mainSlide.contains(sub)) {
      const rect = sub.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      const dist = Math.abs(window.innerWidth / 2 - mid);
      if (dist < closestDist) {
        closest = sub;
        closestDist = dist;
      }
    }
  });
  return closest ? closest.id : null;
}

// Integrate with your applySection()
const originalApplySection = applySection;
applySection = function(id) {
  if (!id || id === currentSection) return;
  currentSection = id;
  const label = sectionNames[id] || id.toUpperCase();
  console.log(`Current slide: ${label}`);

  updateMarqueeText(label);
  setActiveNav(id);

  const slideEl = document.getElementById(id);
  const subId = detectSubsection(slideEl);
  updateStickyTitle(id, subId);
};

// Re-run when scrolling for sub detection
if (wrapper) {
  wrapper.addEventListener('scroll', () => {
    const slideEl = document.getElementById(currentSection);
    if (slideEl) {
      const subId = detectSubsection(slideEl);
      updateStickyTitle(currentSection, subId);
    }
  });
}

// --- Floating Footer Behavior ---
const footer = document.querySelector('.footer');
let hideTimeout = null;

if (wrapper && footer) {
  wrapper.addEventListener('scroll', () => {
    // Show footer immediately on scroll
    footer.classList.remove('hidden');

    // Clear any previous hide timer
    clearTimeout(hideTimeout);

    // Hide after user stops scrolling for 1 second
    hideTimeout = setTimeout(() => {
      footer.classList.add('hidden');
    }, 1000);
  });
}



