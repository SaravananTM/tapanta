// Tapanta Admin Panel

const ADMIN_HASH = '006e7c50e36e414210445a097499da0f89bd22aadbf3b999764cd5f93c4d68cc';
const AUTH_KEY = 'tapanta_admin_auth';

async function hashPassword(pass) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pass);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let currentTab = 'pending';

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function showPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').classList.add('active');
  renderStats();
  renderExperts();
}

function showLogin() {
  sessionStorage.removeItem(AUTH_KEY);
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('adminPanel').classList.remove('active');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pass = document.getElementById('adminPass').value;
  const hashed = await hashPassword(pass);
  if (hashed === ADMIN_HASH) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    showPanel();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

document.getElementById('logoutBtn').addEventListener('click', showLogin);

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    renderExperts();
  });
});

async function renderStats() {
  const all = await ExpertsDB.getAll();
  const pending = all.filter(e => e.status === 'pending').length;
  const approved = all.filter(e => e.status === 'approved').length;
  const rejected = all.filter(e => e.status === 'rejected').length;

  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('adminStats').innerHTML = `
    <div class="admin-stat">
      <div class="admin-stat__value">${all.length}</div>
      <div class="admin-stat__label">Total Applications</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat__value" style="color: #F59E0B;">${pending}</div>
      <div class="admin-stat__label">Pending Review</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat__value" style="color: #10B981;">${approved}</div>
      <div class="admin-stat__label">Approved</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat__value" style="color: #EF4444;">${rejected}</div>
      <div class="admin-stat__label">Rejected</div>
    </div>
  `;

  // Add bookings count
  try {
    var bSnap = await firebase.firestore().collection('bookings').get();
    document.getElementById('adminStats').innerHTML += `
      <div class="admin-stat">
        <div class="admin-stat__value" style="color: #7C3AED;">${bSnap.docs.length}</div>
        <div class="admin-stat__label">Total Bookings</div>
      </div>
    `;
  } catch(e) { console.error(e); }
}

async function renderExperts() {
  if (currentTab === 'bookings') {
    await renderBookings();
    return;
  }
  const all = await ExpertsDB.getAll();
  let filtered;

  if (currentTab === 'all') filtered = all;
  else filtered = all.filter(e => e.status === currentTab);

  const container = document.getElementById('expertsList');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <p>No ${currentTab === 'all' ? '' : currentTab} applications yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(expert => `
    <div class="expert-row">
      <div class="expert-row__info">
        <div class="expert-row__name">
          ${escapeHtml(expert.name)}
          <span class="status-badge status-badge--${expert.status}">${expert.status}</span>
        </div>
        <div class="expert-row__meta">
          ${escapeHtml(expert.specialty)} · ${escapeHtml(expert.category)} · ${expert.experience} yrs exp · ₹${expert.price}/session
        </div>
        <div class="expert-row__detail">
          <strong>Email:</strong> ${escapeHtml(expert.email)} · <strong>Phone:</strong> ${escapeHtml(expert.phone)}<br>
          <strong>Bio:</strong> ${escapeHtml(expert.bio).substring(0, 200)}${expert.bio.length > 200 ? '...' : ''}<br>
          <strong>Qualifications:</strong> ${escapeHtml(expert.qualifications).substring(0, 200)}<br>
          ${expert.linkedin ? `<strong>LinkedIn/Website:</strong> <a href="${escapeHtml(expert.linkedin)}" target="_blank" rel="noopener">${escapeHtml(expert.linkedin)}</a><br>` : ''}
          <strong>Applied:</strong> ${new Date(expert.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      <div class="expert-row__actions">
        ${expert.status === 'pending' ? `
          <button class="btn btn--primary btn--sm" onclick="approveExpert('${expert.id}')">✓ Approve</button>
          <button class="btn btn--outline btn--sm" style="border-color: #EF4444; color: #EF4444;" onclick="rejectExpert('${expert.id}')">✗ Reject</button>
        ` : ''}
        ${expert.status === 'rejected' ? `
          <button class="btn btn--primary btn--sm" onclick="approveExpert('${expert.id}')">✓ Approve</button>
        ` : ''}
        ${expert.status === 'approved' ? `
          <button class="btn btn--outline btn--sm" style="border-color: #EF4444; color: #EF4444;" onclick="rejectExpert('${expert.id}')">Revoke</button>
        ` : ''}
        <button class="btn btn--outline btn--sm" onclick="deleteExpert('${expert.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}


async function approveExpert(id) {
  if (confirm('Approve this expert? They will appear on the public site.')) {
    await ExpertsDB.approve(id);
    renderStats();
    renderExperts();
  }
}

async function rejectExpert(id) {
  if (confirm('Reject this expert application?')) {
    await ExpertsDB.reject(id);
    renderStats();
    renderExperts();
  }
}

async function deleteExpert(id) {
  if (confirm('Permanently delete this application? This cannot be undone.')) {
    await ExpertsDB.delete(id);
    renderStats();
    renderExperts();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Init
if (isLoggedIn()) {
  showPanel();
} else {
  showLogin();
}

async function renderBookings() {
  const container = document.getElementById('expertsList');
  try {
    const snap = await firebase.firestore().collection('bookings').get();
    var bookings = snap.docs.map(d => d.data());
    bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (bookings.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📅</div><p>No bookings yet.</p></div>';
      return;
    }

    container.innerHTML = bookings.map(b => {
      var typeIcons = { chat: '💬', call: '📞', video: '📹' };
      var icon = typeIcons[b.type] || '📅';
      var d = b.date ? new Date(b.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
      var statusColor = b.status === 'confirmed' ? '#10B981' : '#64748B';
      return `<div class="expert-row">
        <div style="font-size:1.8rem;flex-shrink:0;">${icon}</div>
        <div class="expert-row__info">
          <div class="expert-row__name">${escapeHtml(b.userName || 'Unknown User')} → ${escapeHtml(b.expertName || 'Unknown Expert')}</div>
          <div class="expert-row__meta">${escapeHtml(b.expertSpecialty || '')} · ${d} at ${escapeHtml(b.timeSlot || '-')} · ₹${b.price || 0}</div>
          <div class="expert-row__detail">
            <strong>User Email:</strong> ${escapeHtml(b.userEmail || '-')} · <strong>Payment:</strong> ${escapeHtml(b.paymentStatus || '-')} · <strong>Status:</strong> <span style="color:${statusColor};font-weight:600;">${b.status || '-'}</span><br>
            ${b.meetLink ? '<strong>Meet Link:</strong> <a href="' + escapeHtml(b.meetLink) + '" target="_blank" rel="noopener">' + escapeHtml(b.meetLink) + '</a>' : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-items:flex-start;">
          ${getWhatsAppBtn(b, d)}
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load bookings:', err);
    container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">⚠️</div><p>Failed to load bookings.</p></div>';
  }
}

function getWhatsAppBtn(b, dateStr) {
  var phone = (b.expertPhone || '').replace(/[^0-9]/g, '');
  if (!phone) return '<span style="font-size:0.8rem;color:var(--text-light);">No phone</span>';
  if (phone.length === 10) phone = '91' + phone;
  var msg = '🔔 *New Booking on Tapanta!*\n\n' +
    '👤 *Client:* ' + (b.userName || 'User') + '\n' +
    '📅 *Date:* ' + dateStr + '\n' +
    '🕐 *Time:* ' + (b.timeSlot || '-') + '\n' +
    '📋 *Type:* ' + (b.type || '-') + '\n' +
    '💰 *Fee:* ₹' + (b.price || 0) + '\n\n' +
    '🔗 *Session Link:* ' + (b.meetLink || '-') + '\n\n' +
    'Please join at the booked time. Thank you!';
  return '<a href="https://wa.me/' + phone + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" class="btn btn--sm" style="background:#25D366;color:#fff;">📲 WhatsApp Expert</a>';
}
