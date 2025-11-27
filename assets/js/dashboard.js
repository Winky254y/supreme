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
});
