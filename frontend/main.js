import { profile } from './profile.js';

// Centralized profile data binding
document.querySelectorAll('[data-profile]').forEach(node => {
  node.textContent = profile[node.dataset.profile] ?? node.textContent;
});

document.querySelectorAll('[data-profile-href]').forEach(node => {
  const value = profile[node.dataset.profileHref];
  if (value) {
    node.href = node.dataset.profileHref === 'email' ? `mailto:${value}` : value;
  }
});

const canvas = document.querySelector('#scene');
const fallback = document.querySelector('#webgl-fallback');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let animId = null;

// 3D Scene Initialization — Resilient dynamic loading with context-loss protection
async function makeScene() {
  if (!canvas) return;

  try {
    // Dynamic import prevents CDN failure from blocking main thread execution
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js');

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x09090b, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.055);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.2, 13);

    const group = new THREE.Group();
    const isMobileInitial = window.innerWidth < 768;
    group.position.set(isMobileInitial ? 0 : 3.7, isMobileInitial ? -0.8 : 0.15, 0);
    group.scale.setScalar(isMobileInitial ? 0.72 : 1);
    scene.add(group);

    const burgundy = new THREE.Color(0x6e2539);
    const rose = new THREE.Color(0xd8a6b2);
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xa9546e,
      metalness: 0.25,
      roughness: 0.12,
      transmission: 0.48,
      thickness: 0.6,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide
    });
    const metal = new THREE.MeshStandardMaterial({ color: 0x6e2539, metalness: 0.82, roughness: 0.21 });
    const faint = new THREE.MeshStandardMaterial({ color: 0x411722, metalness: 0.6, roughness: 0.35 });

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.1, 5.2, 6, 1, true), glass);
    tower.rotation.set(0.11, 0.35, 0.1);
    tower.position.set(0, -0.5, 0);
    group.add(tower);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 5.8, 6), metal);
    core.rotation.y = 0.35;
    group.add(core);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.022, 8, 64),
      new THREE.MeshBasicMaterial({ color: rose, transparent: true, opacity: 0.42 })
    );
    halo.rotation.x = 1.12;
    halo.position.y = -1.5;
    group.add(halo);

    const halo2 = halo.clone();
    halo2.scale.set(0.62, 0.62, 0.62);
    halo2.position.y = 1.3;
    halo2.rotation.x = 0.82;
    group.add(halo2);

    const objects = [];
    const octa = new THREE.OctahedronGeometry(0.5, 0);
    const ico = new THREE.IcosahedronGeometry(0.33, 1);
    [
      [-3.1, 1.5, -1.4, 0.65],
      [2.5, 2.4, -2, 0.45],
      [-2.5, -2.2, -1, 0.6],
      [3, -1.8, -2, 0.35],
      [-0.5, 3.3, -3, 0.28]
    ].forEach((p, i) => {
      const mesh = new THREE.Mesh(i % 2 ? ico : octa, i % 3 ? faint : metal);
      mesh.position.set(p[0], p[1], p[2]);
      mesh.scale.setScalar(p[3]);
      group.add(mesh);
      objects.push(mesh);
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        color: 0x110c0e,
        metalness: 0.3,
        roughness: 0.55,
        transparent: true,
        opacity: 0.43
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.15;
    scene.add(floor);

    const ambient = new THREE.AmbientLight(0x6e2539, 1.6);
    scene.add(ambient);

    const key = new THREE.PointLight(0xd8a6b2, 80, 18, 2);
    key.position.set(-1, 3, 5);
    scene.add(key);

    const red = new THREE.PointLight(0x6e2539, 120, 20, 2);
    red.position.set(5, -1, 3);
    scene.add(red);

    const particlesGeo = new THREE.BufferGeometry();
    const count = window.innerWidth < 700 ? 95 : 190;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 17;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9 - 2;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particlesGeo,
      new THREE.PointsMaterial({
        color: rose,
        size: 0.026,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
      })
    );
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let scroll = 0;

    // Filter pointer events: ignore finger touch moves to preserve smooth touch scroll
    window.addEventListener(
      'pointermove',
      e => {
        if (e.pointerType === 'touch') return;
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        scroll = Math.min(window.scrollY / window.innerHeight, 4);
      },
      { passive: true }
    );

    // Smooth debounced resize loop via requestAnimationFrame
    let resizePending = false;
    function handleResize() {
      resizePending = false;
      const isMobile = window.innerWidth < 768;
      group.position.x = isMobile ? 0 : 3.7;
      group.position.y = isMobile ? -0.8 : 0.15;
      group.scale.setScalar(isMobile ? 0.72 : 1);

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setSize(window.innerWidth, window.innerHeight);

      if (reducedMotion) {
        renderer.render(scene, camera);
      }
    }

    window.addEventListener('resize', () => {
      if (!resizePending) {
        resizePending = true;
        requestAnimationFrame(handleResize);
      }
    }, { passive: true });

    // WebGL context loss safety
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      if (animId) cancelAnimationFrame(animId);
      if (fallback) fallback.style.display = 'block';
    });

    const clock = new THREE.Clock();

    function animate() {
      const t = clock.getElapsedTime();
      if (!reducedMotion) {
        group.rotation.y += (mouseX * 0.35 - group.rotation.y) * 0.025;
        group.rotation.x += (-mouseY * 0.18 - group.rotation.x) * 0.025;
        group.position.y = (window.innerWidth < 768 ? -0.8 : 0.15) + Math.sin(t * 0.45) * 0.12 - scroll * 0.42;
        halo.rotation.z = t * 0.08;
        halo2.rotation.z = -t * 0.11;
        objects.forEach((o, i) => {
          o.rotation.x += 0.003 + i * 0.0004;
          o.rotation.y += 0.004;
          o.position.y += Math.sin(t * 0.7 + i) * 0.0015;
        });
        particles.rotation.y = t * 0.012;
      }

      camera.position.x += (mouseX * 0.45 - camera.position.x) * 0.018;
      camera.position.y += (-mouseY * 0.2 - camera.position.y) * 0.018;
      renderer.render(scene, camera);

      if (!reducedMotion) {
        animId = requestAnimationFrame(animate);
      }
    }

    animate();
    if (fallback) fallback.style.display = 'none';
  } catch (err) {
    console.warn('Three.js scene initialization fell back to CSS ambient glow:', err);
    if (canvas) canvas.style.display = 'none';
    if (fallback) fallback.style.display = 'block';
  }
}

makeScene();

// Cinematic Introduction Overlay
const intro = document.querySelector('#intro');
let introTimer = null;
let introDismissed = false;

function dismissIntro() {
  if (introDismissed || !intro) return;
  introDismissed = true;
  if (introTimer) clearTimeout(introTimer);

  intro.classList.add('done');

  // Immediately reveal above-the-fold Hero elements so they render without delay
  document.querySelectorAll('#home .reveal').forEach(el => el.classList.add('visible'));

  setTimeout(() => {
    if (intro && intro.parentNode) {
      intro.remove();
    }
  }, 850);
}

const skipBtn = document.querySelector('#skipIntro');
if (skipBtn) {
  skipBtn.addEventListener('click', dismissIntro);
}

if (reducedMotion) {
  dismissIntro();
} else {
  introTimer = setTimeout(dismissIntro, 3000);
}

// Navigation & Mobile Drawer
const nav = document.querySelector('#nav');
const toggle = document.querySelector('#menuToggle');

if (toggle && nav) {
  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    });
  });

  // Close mobile nav when clicking outside
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.focus();
    }
  });
}

// Scroll Reveal & Active Section Tracking
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(node => observer.observe(node));

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  },
  { rootMargin: '-18% 0px -40%' }
);

document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

// Footer Dynamic Year
const yearNode = document.querySelector('#year');
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

// Interactive Contact Form Handling
const contactForm = document.querySelector('#contactForm');
const contactSubmit = document.querySelector('#contactSubmit');
const formStatus = document.querySelector('#formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();

    const nameInput = document.querySelector('#contactName');
    const messageInput = document.querySelector('#contactMessage');
    const name = nameInput ? nameInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';

    if (!message) {
      if (formStatus) {
        formStatus.textContent = 'Please enter a message before sending.';
        formStatus.className = 'form-status error';
      }
      return;
    }

    const subject = encodeURIComponent(`Portfolio enquiry from ${name || 'a visitor'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name || 'Portfolio visitor'}`);
    const mailtoUrl = `mailto:${profile.email}?subject=${subject}&body=${body}`;

    // Visual user feedback
    if (contactSubmit) {
      contactSubmit.disabled = true;
      contactSubmit.innerHTML = 'Opening email app... <span>✓</span>';
    }
    if (formStatus) {
      formStatus.textContent = 'Launching your default email client...';
      formStatus.className = 'form-status success';
    }

    // Trigger email client via anchor click for maximum browser compatibility
    const tempLink = document.createElement('a');
    tempLink.href = mailtoUrl;
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();

    setTimeout(() => {
      tempLink.remove();
      if (contactSubmit) {
        contactSubmit.disabled = false;
        contactSubmit.innerHTML = 'Prepare email <span>↗</span>';
      }
      if (formStatus) {
        formStatus.textContent = '';
      }
      contactForm.reset();
    }, 2800);
  });
}
