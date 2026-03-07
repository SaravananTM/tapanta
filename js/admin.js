// Tapanta Admin Panel

const ADMIN_PASSWORD = 'tapanta2026';
const AUTH_KEY = 'tapanta_admin_auth';

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

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const pass = document.getElementById('adminPass').value;
  if (pass === ADMIN_PASSWORD) {
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
}

async function renderExperts() {
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
