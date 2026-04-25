// Tapanta - Google Auth + Phone Number Collection (Firebase)

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Auth state listener - runs on every page
auth.onAuthStateChanged(async function(user) {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  // Apply saved theme on load
  var saved = localStorage.getItem('tapanta-theme');
  if (saved === 'dark') document.body.classList.add('dark-theme');

  // Add/remove My Sessions nav link based on login
  var sessionsLink = document.getElementById('navSessionsItem');
  if (user && !sessionsLink) {
    var sli = document.createElement('li');
    sli.id = 'navSessionsItem';
    sli.innerHTML = '<a href="my-sessions.html">My Sessions</a>';
    // Insert before Blog link
    var blogLink = null;
    navLinks.querySelectorAll('a').forEach(function(a) { if (a.textContent.trim() === 'Blog') blogLink = a.closest('li'); });
    if (blogLink) navLinks.insertBefore(sli, blogLink);
    else navLinks.appendChild(sli);
  } else if (!user && sessionsLink) {
    sessionsLink.remove();
  }

  // Toggle free session tags based on login state
  document.querySelectorAll('.free-session-login').forEach(function(el) { el.style.display = user ? 'none' : 'block'; });
  var freeTag = document.getElementById('freeSessionTag');
  var freeLogin = document.getElementById('freeSessionLogin');
  if (freeTag) freeTag.style.display = user ? 'block' : 'none';
  if (freeLogin) freeLogin.style.display = user ? 'none' : 'block';
  var freeBooking = document.getElementById('freeSessionBooking');
  var freeBookingLogin = document.getElementById('freeSessionBookingLogin');
  if (freeBooking) freeBooking.style.display = user ? 'block' : 'none';
  if (freeBookingLogin) freeBookingLogin.style.display = user ? 'none' : 'block';

  // Remove existing auth and theme elements to re-order
  const oldAuth = document.getElementById('navAuthItem');
  if (oldAuth) oldAuth.remove();
  const oldTheme = document.getElementById('themeToggleItem');
  if (oldTheme) oldTheme.remove();

  const li = document.createElement('li');
  li.id = 'navAuthItem';

  if (user) {
    // Check if user has phone number in Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().phone) {
      // Logged in with phone - show compact profile
      const photo = user.photoURL || '';
      const name = (user.displayName || 'User').split(' ')[0];
      li.innerHTML = '<div class="nav-profile" id="navProfile">' +
        '<span class="nav-profile__name">' + name + '</span>' +
        (photo ? '<img src="' + photo + '" alt="" class="nav-profile__img">' : '<span class="nav-profile__icon">👤</span>') +
        '<div class="nav-profile__dropdown" id="profileDropdown">' +
          '<a href="#" onclick="tapantaSignOut();return false;" class="nav-profile__logout">Sign Out</a>' +
        '</div></div>';
    } else {
      // Logged in but no phone - show phone modal
      showPhoneModal(user);
      li.innerHTML = '<span class="nav__cta" style="cursor:pointer;font-size:0.85rem;">Setting up...</span>';
    }
  } else {
    // Not logged in - show sign in button
    li.innerHTML = '<a href="#" onclick="tapantaSignIn();return false;" class="nav__cta" style="background:var(--success);">Sign In</a>';
  }
  navLinks.appendChild(li);

  // Always add theme toggle after auth item
  var themeLi2 = document.createElement('li');
  themeLi2.id = 'themeToggleItem';
  var isDark = document.body.classList.contains('dark-theme');
  themeLi2.innerHTML = '<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">' + (isDark ? '☀️' : '🌙') + '</button>';
  navLinks.appendChild(themeLi2);
  document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    var dark = document.body.classList.contains('dark-theme');
    this.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('tapanta-theme', dark ? 'dark' : 'light');
  });
});

// Google Sign In
function tapantaSignIn() {
  auth.signInWithPopup(googleProvider).catch(function(err) {
    console.error('Sign in failed:', err);
    if (err.code !== 'auth/popup-closed-by-user') {
      alert('Sign in failed. Please try again.');
    }
  });
}

// Sign Out
function tapantaSignOut() {
  auth.signOut();
}

// Phone number modal
function showPhoneModal(user) {
  // Don't show if already showing
  if (document.getElementById('phoneModal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'phoneModal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:32px;max-width:400px;width:90%;text-align:center;">' +
    '<div style="font-size:2.5rem;margin-bottom:12px;">📱</div>' +
    '<h3 style="margin-bottom:8px;">Welcome, ' + (user.displayName || 'there').split(' ')[0] + '!</h3>' +
    '<p style="color:#666;margin-bottom:20px;font-size:0.9rem;">Please enter your phone number to complete your profile.</p>' +
    '<input type="tel" id="phoneInput" placeholder="+91 9876543210" style="width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:1rem;margin-bottom:16px;box-sizing:border-box;">' +
    '<button onclick="savePhone()" id="savePhoneBtn" style="width:100%;padding:12px;background:var(--primary,#4F46E5);color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer;font-weight:600;">Save & Continue</button>' +
    '<p id="phoneError" style="color:#e53e3e;font-size:0.85rem;margin-top:8px;display:none;"></p>' +
    '</div>';
  document.body.appendChild(overlay);

  setTimeout(function() {
    var inp = document.getElementById('phoneInput');
    if (inp) inp.focus();
  }, 200);
}

// Save phone number to Firestore
async function savePhone() {
  const phone = document.getElementById('phoneInput').value.trim();
  const btn = document.getElementById('savePhoneBtn');
  const err = document.getElementById('phoneError');

  if (!phone || phone.length < 10) {
    err.textContent = 'Please enter a valid phone number';
    err.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const user = auth.currentUser;
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || '',
      email: user.email || '',
      phone: phone,
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString()
    }, { merge: true });

    // Remove modal and refresh auth state
    const modal = document.getElementById('phoneModal');
    if (modal) modal.remove();
    // Trigger re-render
    auth.onAuthStateChanged.call(null, user);
    location.reload();
  } catch (e) {
    console.error('Failed to save phone:', e);
    err.textContent = 'Something went wrong. Please try again.';
    err.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Save & Continue';
  }
}

// Toggle profile dropdown
document.addEventListener('click', function(e) {
  var profile = e.target.closest('.nav-profile');
  var dropdown = document.getElementById('profileDropdown');
  if (profile && dropdown) {
    dropdown.classList.toggle('show');
  } else if (dropdown) {
    dropdown.classList.remove('show');
  }
});

// Booking auth gate - intercept Book Now clicks when not logged in
document.addEventListener('click', function(e) {
  // Skip on admin page
  if (window.location.pathname.indexOf('admin') !== -1) return;
  var link = e.target.closest('a[href*="booking"]');
  if (!link) {
    // Also check for Book Now buttons on expert cards/profiles
    var btn = e.target.closest('.expert-card__actions .btn, .profile__sidebar .btn');
    if (btn) link = btn;
  }
  if (!link) return;
  var text = link.textContent.toLowerCase();
  if (text.indexOf('book') === -1) return;
  if (auth.currentUser) return;
  e.preventDefault();
  e.stopPropagation();
  showLoginPrompt();
});

function showLoginPrompt() {
  if (document.getElementById('loginPromptModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'loginPromptModal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:32px;max-width:380px;width:90%;text-align:center;">' +
    '<div style="font-size:2.5rem;margin-bottom:12px;">🔐</div>' +
    '<h3 style="margin-bottom:8px;">Sign in to Book</h3>' +
    '<p style="color:#666;margin-bottom:20px;font-size:0.9rem;">Please sign in with your Google account to book a consultation.</p>' +
    '<button onclick="tapantaSignIn();document.getElementById(\'loginPromptModal\').remove();" style="width:100%;padding:12px;background:#4285F4;color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">' +
      '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:20px;height:20px;"> Sign in with Google</button>' +
    '<a href="#" onclick="document.getElementById(\'loginPromptModal\').remove();return false;" style="display:block;margin-top:14px;color:#888;font-size:0.85rem;">Cancel</a>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(ev) {
    if (ev.target === overlay) overlay.remove();
  });
}
