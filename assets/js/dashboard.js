// Dashboard interactions with simple session persistence (localStorage)
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  // Session helpers: store JSON {email, token}
  function setUserSession(obj){
    if (!obj) return;
    if (typeof obj === 'string') obj = { email: obj };
    localStorage.setItem('moveitUser', JSON.stringify(obj));
  }
  function clearUserSession(){
    localStorage.removeItem('moveitUser');
  }
  function getUserSession(){
    const v = localStorage.getItem('moveitUser');
    if (!v) return null;
    try{ return JSON.parse(v); } catch(e){ return { email: String(v) }; }
  }

  function showDashboard(user){
    const email = (typeof user === 'string' ? user : (user?.email || '')) || '';
    const username = (email.split('@')[0]) || 'Member';
    const pretty = username.charAt(0).toUpperCase() + username.slice(1);
    const dashNameEl = document.getElementById('dashName');
    const dashAvatarEl = document.getElementById('dashAvatar');
    const welcomeTitle = document.getElementById('welcomeTitle');
    if (dashNameEl) dashNameEl.textContent = pretty;
    if (dashAvatarEl) dashAvatarEl.textContent = pretty.charAt(0);
    if (welcomeTitle) welcomeTitle.textContent = `Hello, ${pretty}`;
    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
  }

  // Auto-login if session exists
  const existing = getUserSession();
  if (existing && existing.email) showDashboard(existing);

  // Login: call backend /api/login if available
  if (loginBtn) loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!email || !pass) return alert('Please enter email and password');
    try{
      const resp = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password: pass }) });
      const data = await resp.json();
      if (!resp.ok) return alert(data.error || 'Login failed');
      setUserSession({ email: data.email, token: data.token });
      showDashboard({ email: data.email });
    }catch(err){
      // fallback to local offline behaviour
      setUserSession(email);
      showDashboard(email);
    }
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

  // --- Signup modal behavior (opens when clicking Dashboard link) ---
  const dashboardLink = document.getElementById('dashboardLink');
  const signupModal = document.getElementById('signupModal');
  const signupForm = document.getElementById('signupForm');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupConfirm = document.getElementById('signupConfirm');
  const signupError = document.getElementById('signupError');
  const signupCancel = document.getElementById('signupCancel');
  const togglePwd = document.getElementById('togglePwd');

  function openSignup(){
    lastFocusedElement = document.activeElement;
    signupModal.setAttribute('aria-hidden','false');
    signupModal.classList.add('open');
    setTimeout(()=> signupModal.querySelector('.modal-close')?.focus(),50);
  }

  function closeSignup(){
    signupModal.classList.remove('open');
    signupModal.setAttribute('aria-hidden','true');
    signupError.style.display = 'none';
    signupForm.reset();
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  if (dashboardLink) {
    dashboardLink.addEventListener('click', (e) => {
      const sess = getUserSession();
      if (sess && sess.email) {
        // already signed in — allow normal navigation to dashboard.html
        return;
      }
      // not signed in: open signup modal instead of navigating
      e.preventDefault();
      openSignup();
      console.log('event:open_signup_from_nav');
    });
  }

  // close handlers
  signupModal?.addEventListener('click', (e)=>{ if (e.target === signupModal) closeSignup(); });
  signupModal?.querySelector('.modal-close')?.addEventListener('click', closeSignup);
  signupCancel?.addEventListener('click', closeSignup);

  // show/hide password
  togglePwd?.addEventListener('click', ()=>{
    const type = signupPassword.type === 'password' ? 'text' : 'password';
    signupPassword.type = type;
    signupConfirm.type = type;
    togglePwd.textContent = type === 'text' ? 'Hide' : 'Show';
    togglePwd.setAttribute('aria-pressed', type === 'text');
  });

  // validation & server signup
  function clientStrongPassword(pwd){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
  }

  signupForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = (signupEmail.value || '').trim();
    const pwd = signupPassword.value || '';
    const confirm = signupConfirm.value || '';

    signupError.style.display = 'none';

    if (!email || !pwd || !confirm) {
      signupError.style.color = '#a00';
      signupError.textContent = 'Please complete all fields.';
      signupError.style.display = 'block';
      return;
    }
    if (!clientStrongPassword(pwd)) {
      signupError.style.color = '#a00';
      signupError.textContent = 'Password must be at least 8 chars and include upper, lower, number and special char.';
      signupError.style.display = 'block';
      signupPassword.focus();
      return;
    }
    if (pwd !== confirm) {
      signupError.style.color = '#a00';
      signupError.textContent = 'Passwords do not match.';
      signupError.style.display = 'block';
      signupConfirm.focus();
      return;
    }

    // call backend signup
    try{
      const resp = await fetch('/api/signup', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password: pwd }) });
      const data = await resp.json();
      if (!resp.ok) {
        signupError.style.color = '#a00';
        signupError.textContent = data.error || (data.message || 'Signup failed');
        signupError.style.display = 'block';
        return;
      }

      // success - show verification instructions
      signupError.style.color = '#067a07';
      signupError.textContent = 'Account created — verification sent. Check your email.';
      signupError.style.display = 'block';
      if (data.previewUrl) {
        const a = document.createElement('a');
        a.href = data.previewUrl;
        a.target = '_blank';
        a.textContent = 'Open verification preview';
        a.style.display = 'block';
        a.style.marginTop = '8px';
        signupError.appendChild(a);
      }
      if (data.verifyUrl && !data.previewUrl) {
        const a2 = document.createElement('a');
        a2.href = data.verifyUrl;
        a2.target = '_blank';
        a2.textContent = 'Open verification link';
        a2.style.display = 'block';
        a2.style.marginTop = '8px';
        signupError.appendChild(a2);
      }

      // keep modal open until user verifies; do not auto-login
    }catch(err){
      // fallback: local store
      const users = JSON.parse(localStorage.getItem('moveitUsers') || '[]');
      users.push({ email: email.toLowerCase(), password: pwd, createdAt: Date.now() });
      localStorage.setItem('moveitUsers', JSON.stringify(users));
      setUserSession(email.toLowerCase());
      closeSignup();
      alert('Account created locally (offline fallback).');
      showDashboard(email.toLowerCase());
    }
  });

  // keyboard: close signup on ESC
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && signupModal && signupModal.classList.contains('open')) closeSignup();
  });

  // Social signup buttons (placeholders — server must be configured)
  const googleSign = document.getElementById('googleSign');
  const facebookSign = document.getElementById('facebookSign');
  googleSign?.addEventListener('click', async () => {
    // navigate to backend OAuth endpoint (server should redirect)
    window.location.href = '/auth/google';
  });
  facebookSign?.addEventListener('click', async () => {
    window.location.href = '/auth/facebook';
  });
});
