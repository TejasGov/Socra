/* js/login.js — Mock sign-in (loaded by login.html) */

const MOCK_CREDENTIALS = {
  PD01: { pwd: '0202', uid: 'owner' },
  TG05: { pwd: '1515', uid: 'tejas' },
  AK03: { pwd: '0909', uid: 'atshal' },
};

document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');

  if (localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')) {
    window.location.href = 'index.html';
    return;
  }

  const saved = localStorage.getItem('savedUserId');
  if (saved) document.getElementById('userId').value = saved;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = document.getElementById('userId').value.trim().toUpperCase();
    const password = document.getElementById('password').value.trim();
    const remember = document.getElementById('rememberMe').checked;
    const errorMsg = document.getElementById('error-msg');

    const user = MOCK_CREDENTIALS[userId];
    if (user && user.pwd === password) {
      if (remember) {
        localStorage.setItem('currentUser', user.uid);
        sessionStorage.removeItem('currentUser');
      } else {
        sessionStorage.setItem('currentUser', user.uid);
        localStorage.removeItem('currentUser');
      }
      localStorage.setItem('savedUserId', userId);
      window.location.href = 'index.html';
    } else {
      errorMsg.textContent = 'Invalid User ID or Password';
      errorMsg.style.display = 'block';
    }
  });
});
