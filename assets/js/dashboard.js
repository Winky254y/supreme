// Dashboard interactions with simple session persistence (localStorage)
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  function setUserSession(email){
    localStorage.setItem('moveitUser', email);
  }
  function clearUserSession(){
    localStorage.removeItem('moveitUser');
  }
  function getUserSession(){
    return localStorage.getItem('moveitUser');
  }

  function showDashboard(userEmail){
    const username = (userEmail || '').split('@')[0] || 'Member';
    document.getElementById('dashName').textContent = username.charAt(0).toUpperCase() + username.slice(1);
    document.getElementById('dashAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('welcomeTitle').textContent = `Hello, ${username}`;
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
  }

  // Auto-login if session exists
  const existing = getUserSession();
  if (existing) showDashboard(existing);

  if (loginBtn) loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!email || !pass) return alert('Please enter email and password (demo only)');
    // set session and show dashboard
    setUserSession(email);
    showDashboard(email);
  });

  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    clearUserSession();
    dashboardView.style.display = 'none';
    loginView.style.display = 'block';
    const emailEl = document.getElementById('email');
    const passEl = document.getElementById('password');
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
    // optional: redirect back to home
    // window.location.href = 'index.html';
  });

  // --- Interactive Features Section ---
  const featuresGrid = document.getElementById('featuresGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const featureSearch = document.getElementById('featureSearch');
  const modal = document.getElementById('featureModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalBullets = document.getElementById('modalBullets');
  const modalClose = document.querySelector('.modal-close');
  const bookNow = document.getElementById('bookNow');
  const whatsappLink = document.getElementById('whatsappLink');

  function filterFeatures(filter) {
    const cards = featuresGrid ? Array.from(featuresGrid.querySelectorAll('.feature')) : [];
    cards.forEach(card => {
      const cat = card.getAttribute('data-category') || '';
      const title = (card.getAttribute('data-title') || card.querySelector('h3')?.textContent || '').toLowerCase();
      const query = (featureSearch?.value || '').trim().toLowerCase();

      const matchesFilter = (filter === 'all') || (cat === filter);
      const matchesQuery = !query || title.includes(query) || card.textContent.toLowerCase().includes(query);

      if (matchesFilter && matchesQuery) {
        card.classList.add('visible');
        card.style.display = '';
      } else {
        card.classList.remove('visible');
        card.style.display = 'none';
      }
    });
  }

  // Attach filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.getAttribute('data-filter');
      filterFeatures(f);
    });
  });

  // Search input
  if (featureSearch) {
    featureSearch.addEventListener('input', () => {
      const active = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
      filterFeatures(active);
    });
  }

  // Reveal on scroll for features
  function revealOnScroll() {
    const items = document.querySelectorAll('.feature');
    const windowH = window.innerHeight;
    items.forEach(it => {
      const rect = it.getBoundingClientRect();
      if (rect.top < windowH - 80) {
        it.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();

  // Modal open / close
  let lastFocusedElement = null;
  featuresGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('.small-cta');
    if (!btn) return;
    const card = btn.closest('.feature');
    if (!card) return;

    const title = card.getAttribute('data-title') || card.querySelector('h3')?.textContent;
    const desc = card.querySelector('p')?.textContent || '';
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalBullets.innerHTML = '';
    // Example bullets per category (could be dynamic)
    const cat = card.getAttribute('data-category');
    const bullets = {
      packing: ['Reusable crates provided','Itemized inventory','Fragile labeling and custom crating'],
      transport: ['Solar-hybrid vans','GPS tracking & ETAs','Experienced drivers'],
      insurance: ['Free basic cover KSh 500,000','Fast claims','Optional premium plans'],
      student: ['20% discount','Priority campus pickups','Free return crate option'],
      corporate: ['Account manager','Off-hours moves','Bulk invoicing']
    };

    (bullets[cat] || []).forEach(b => {
      const li = document.createElement('li');
      li.textContent = b;
      modalBullets.appendChild(li);
    });

    // Setup booking & whatsapp link
    bookNow.onclick = () => {
      // Analytics hook
      console.log('event:book_now_click', { feature: title });
      if (window.dataLayer) window.dataLayer.push({ event: 'book_now_click', feature: title });

      // If contact form exists, scroll to it and prefill
      const contact = document.getElementById('contact');
      if (contact) {
        const textarea = contact.querySelector('textarea');
        if (textarea) textarea.value = `I'd like to book: ${title}. Please advise next steps.`;
        contact.scrollIntoView({behavior:'smooth',block:'center'});
        const firstInput = contact.querySelector('input, textarea, button');
        if (firstInput) firstInput.focus();
      } else {
        // fallback to dashboard
        window.location.href = '/dashboard.html';
      }
    };

    whatsappLink.onclick = () => {
      const phone = '254705792140';
      const text = encodeURIComponent(`Hi, I'm interested in ${title}. Please help me book.`);
      // Analytics hook
      console.log('event:whatsapp_click', { feature: title });
      if (window.dataLayer) window.dataLayer.push({ event: 'whatsapp_click', feature: title });
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    // focus management for accessibility
    lastFocusedElement = document.activeElement;
    modal.setAttribute('aria-hidden','false');
    modal.classList.add('open');
    // move focus into modal
    setTimeout(()=>{
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    },50);

    // analytics event for modal open
    console.log('event:feature_modal_open', { feature: title });
    if (window.dataLayer) window.dataLayer.push({ event: 'feature_modal_open', feature: title });
  });

  modalClose?.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    // restore focus
    if (lastFocusedElement) lastFocusedElement.focus();
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      if (lastFocusedElement) lastFocusedElement.focus();
    }
  });

  // Close modal on ESC and trap focus simple handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      if (lastFocusedElement) lastFocusedElement.focus();
    }
  });

  // --- Parallax for hero layers ---
  const heroLayers = document.querySelectorAll('.parallax-layer');
  heroLayers.forEach((l,i)=>l.classList.add('parallax-transform'));
  let latestScroll = 0; let ticking = false;
  function onScroll(){
    latestScroll = window.pageYOffset;
    if (!ticking) {
      window.requestAnimationFrame(()=>{
        heroLayers.forEach((layer, idx) => {
          const speeds = [0.15,0.3,0.45,0.6,0.9];
          const speed = speeds[idx] || 0.3;
          layer.style.transform = `translate3d(0,${latestScroll * speed}px,0) scale(${1 + speed*0.02})`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
});
