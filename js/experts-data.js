// Tapanta - Expert Data Management (localStorage-based)

const ExpertsDB = {
  _key: 'tapanta_experts',

  getAll() {
    return JSON.parse(localStorage.getItem(this._key) || '[]');
  },

  save(experts) {
    localStorage.setItem(this._key, JSON.stringify(experts));
  },

  addApplication(data) {
    const experts = this.getAll();
    const expert = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...data,
      status: 'pending', // pending | approved | rejected
      rating: 0,
      reviews: 0,
      appliedAt: new Date().toISOString(),
      online: false
    };
    experts.push(expert);
    this.save(experts);
    return expert;
  },

  approve(id) {
    const experts = this.getAll();
    const idx = experts.findIndex(e => e.id === id);
    if (idx !== -1) {
      experts[idx].status = 'approved';
      this.save(experts);
    }
  },

  reject(id) {
    const experts = this.getAll();
    const idx = experts.findIndex(e => e.id === id);
    if (idx !== -1) {
      experts[idx].status = 'rejected';
      this.save(experts);
    }
  },

  delete(id) {
    const experts = this.getAll().filter(e => e.id !== id);
    this.save(experts);
  },

  getApproved() {
    return this.getAll().filter(e => e.status === 'approved');
  },

  getPending() {
    return this.getAll().filter(e => e.status === 'pending');
  },

  getById(id) {
    return this.getAll().find(e => e.id === id) || null;
  }
};

// Expert application form handler
const expertForm = document.getElementById('expertForm');
if (expertForm) {
  expertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      category: document.getElementById('category').value,
      specialty: document.getElementById('specialty').value.trim(),
      experience: document.getElementById('experience').value,
      qualifications: document.getElementById('qualifications').value.trim(),
      bio: document.getElementById('bio').value.trim(),
      price: document.getElementById('price').value,
      linkedin: document.getElementById('linkedin').value.trim()
    };
    ExpertsDB.addApplication(data);
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('successSection').style.display = 'block';
  });
}
