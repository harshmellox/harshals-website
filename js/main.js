/* ==========================================
   MAIN.JS — Fluid interactions
   Lenis smooth scroll + word reveals + milestone
   ========================================== */

// ==========================================
// 1. LENIS SMOOTH SCROLL (the "fluid feel")
// ==========================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// ==========================================
// 2. HEADER SCROLL EFFECT
// ==========================================
const header = document.getElementById('header');

lenis.on('scroll', ({ scroll }) => {
  if (scroll > 80) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }
});

// ==========================================
// 3. MOBILE MENU
// ==========================================
const headerToggle = document.getElementById('headerToggle');
const mobileOverlay = document.getElementById('mobileOverlay');

if (headerToggle && mobileOverlay) {
  headerToggle.addEventListener('click', () => {
    const isOpen = mobileOverlay.classList.toggle('is-open');
    headerToggle.classList.toggle('is-open');

    if (isOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  });

  mobileOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileOverlay.classList.remove('is-open');
      headerToggle.classList.remove('is-open');
      lenis.start();
    });
  });
}

// ==========================================
// 4. SMOOTH SCROLL ON ANCHOR CLICKS
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      lenis.scrollTo(target, { offset: -80 });
    }
  });
});

// ==========================================
// 5. WORD REVEAL ANIMATION (hero text)
// ==========================================
function initWordReveal() {
  const elements = document.querySelectorAll('[data-animate="words"]');

  elements.forEach(el => {
    const html = el.innerHTML;
    // Process the HTML to wrap words while preserving tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    function wrapTextNodes(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        words.forEach(word => {
          if (word.trim() === '') {
            fragment.appendChild(document.createTextNode(word));
          } else {
            const outer = document.createElement('span');
            outer.className = 'word';
            const inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = word;
            outer.appendChild(inner);
            fragment.appendChild(outer);
          }
        });
        node.parentNode.replaceChild(fragment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process children of elements like <em>, <strong>, etc.
        Array.from(node.childNodes).forEach(child => wrapTextNodes(child));
      }
    }

    Array.from(tempDiv.childNodes).forEach(child => wrapTextNodes(child));
    el.innerHTML = tempDiv.innerHTML;

    // Stagger the reveal
    const wordInners = el.querySelectorAll('.word-inner');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          wordInners.forEach((word, i) => {
            word.style.transitionDelay = `${i * 0.06}s`;
            word.classList.add('is-visible');
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(el);
  });
}

initWordReveal();

// ==========================================
// 6. HERO ELEMENTS STAGGER
// ==========================================
function initHeroStagger() {
  const heroChecks = document.querySelectorAll('.hero__check');
  const heroTrust = document.querySelector('.hero__trust');

  // Stagger checks with delay
  setTimeout(() => {
    heroChecks.forEach((check, i) => {
      setTimeout(() => {
        check.classList.add('is-visible');
      }, i * 150);
    });

    setTimeout(() => {
      if (heroTrust) heroTrust.classList.add('is-visible');
    }, heroChecks.length * 150 + 200);
  }, 800);
}

initHeroStagger();

// ==========================================
// 7. SCROLL REVEAL (IntersectionObserver)
// ==========================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -32px 0px'
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ==========================================
// 8. SIDE DOTS ACTIVE STATE
// ==========================================
const sideDots = document.querySelectorAll('.side-dots__item');
const sections = document.querySelectorAll('section[id]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      sideDots.forEach(dot => {
        dot.classList.toggle('is-active', dot.getAttribute('href') === `#${id}`);
      });
      document.querySelectorAll('.header__nav-link').forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => sectionObserver.observe(s));

// ==========================================
// 9. PROCESS MILESTONE PROGRESS LINE
//    (Dixie-style: dynamic line + markers)
// ==========================================
function initMilestone() {
  const processSection = document.getElementById('process');
  const milestoneCol = document.getElementById('processMilestone');
  const milestoneLine = document.getElementById('milestoneLine');
  const milestoneProgress = document.getElementById('milestoneProgress');
  const counterDigits = document.getElementById('counterDigits');
  const markers = milestoneCol ? milestoneCol.querySelectorAll('.milestone-marker') : [];
  const steps = document.querySelectorAll('.process__step');

  if (!processSection || !milestoneCol || !milestoneLine || !milestoneProgress || steps.length === 0) return;

  // Store marker positions (px from top of milestone-col)
  let markerPositions = [];

  function layoutMilestone() {
    const colRect = milestoneCol.getBoundingClientRect();
    const colTop = milestoneCol.offsetTop;
    markerPositions = [];

    // Position each marker at the vertical start of its corresponding step
    steps.forEach((step, i) => {
      if (!markers[i]) return;
      // step.offsetTop is relative to .process__right, which shares grid row with milestone-col
      const markerTop = step.offsetTop + step.offsetHeight * 0.15;
      markers[i].style.top = `${markerTop}px`;
      markerPositions.push(markerTop);
    });

    // Position the grey line from first marker to last marker (+ some extra)
    if (markerPositions.length >= 2) {
      const lineTop = markerPositions[0];
      const lineBottom = markerPositions[markerPositions.length - 1];
      const lineHeight = lineBottom - lineTop;
      milestoneLine.style.top = `${lineTop}px`;
      milestoneLine.style.height = `${lineHeight}px`;
    }
  }

  layoutMilestone();
  window.addEventListener('resize', layoutMilestone);

  // Scroll handler — use native scroll for reliability
  function updateMilestone() {
    const windowHeight = window.innerHeight;
    const triggerPoint = windowHeight * 0.4;

    // Determine active step
    let activeIndex = 0;
    steps.forEach((step, i) => {
      const stepRect = step.getBoundingClientRect();
      if (stepRect.top < triggerPoint) {
        activeIndex = i;
      }
    });

    // Activate/deactivate steps
    steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === activeIndex);
    });

    // Update digit roller
    if (counterDigits) {
      counterDigits.style.transform = `translateY(${activeIndex * -100 / steps.length}%)`;
    }

    // Calculate fill progress based on marker positions
    if (markerPositions.length >= 2) {
      const lineTop = markerPositions[0];
      const lineHeight = markerPositions[markerPositions.length - 1] - lineTop;

      // Current active marker position relative to line start
      const activeMarkerRel = markerPositions[activeIndex] - lineTop;
      // Next marker position (or end of line)
      const nextMarkerRel = markerPositions[activeIndex + 1]
        ? markerPositions[activeIndex + 1] - lineTop
        : lineHeight;

      // How far through current step
      const activeStepRect = steps[activeIndex].getBoundingClientRect();
      const stepHeight = steps[activeIndex].offsetHeight;
      const stepProgress = Math.max(0, Math.min(1,
        (triggerPoint - activeStepRect.top) / stepHeight
      ));

      // Interpolate between current marker and next marker
      const fillPx = activeMarkerRel + (nextMarkerRel - activeMarkerRel) * stepProgress;
      const fillScale = Math.max(0, Math.min(1, fillPx / lineHeight));
      milestoneProgress.style.transform = `scaleY(${fillScale})`;
    }

    // Activate markers up to and including the active step
    markers.forEach((marker, i) => {
      marker.classList.toggle('is-active', i <= activeIndex);
    });
  }

  // Listen on both native scroll and Lenis for reliability
  window.addEventListener('scroll', updateMilestone, { passive: true });
  lenis.on('scroll', updateMilestone);
  // Initial call
  updateMilestone();
}

initMilestone();

// ==========================================
// 10. FAQ ACCORDION
// ==========================================
document.querySelectorAll('.faq-item__q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const wasOpen = item.classList.contains('is-open');

    // Close all
    document.querySelectorAll('.faq-item.is-open').forEach(open => {
      open.classList.remove('is-open');
    });

    // Toggle current
    if (!wasOpen) item.classList.add('is-open');
  });
});

// ==========================================
// 11. FORM SUBMISSION (WhatsApp)
// ==========================================
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const business = document.getElementById('business').value;
    const btype = document.getElementById('btype').value;
    const message = document.getElementById('message').value;

    contactForm.style.display = 'none';
    formSuccess.classList.add('is-active');

    const waNumber = '919XXXXXXXXX';
    let msg = `Hi Harshal! I'd like to book a free consultation.\n\n`;
    msg += `*Name:* ${name}\n*Phone:* ${phone}\n`;
    if (business) msg += `*Business:* ${business}\n`;
    if (btype) msg += `*Type:* ${btype}\n`;
    if (message) msg += `*Challenge:* ${message}\n`;

    setTimeout(() => {
      const openWA = confirm('Send this on WhatsApp for faster response?');
      if (openWA) {
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    }, 1500);
  });
}

// ==========================================
// 12. PARALLAX BIG NUMBER
// ==========================================
const bigText = document.querySelector('.hero__big-text span');

if (bigText) {
  lenis.on('scroll', ({ scroll }) => {
    if (scroll < window.innerHeight) {
      bigText.style.transform = `translateY(${scroll * 0.12}px)`;
    }
  });
}

// ==========================================
// Done
// ==========================================
console.log('🚀 Harshal — Digital Growth Consultancy loaded');
