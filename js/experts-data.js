// Tapanta - Expert Data Management (SheetDB backend)
const SHEET_API = 'https://sheetdb.io/api/v1/z5ld692xtifsm';

const ExpertsDB = {
  async getAll() {
    try {
      const res = await fetch(SHEET_API);
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch experts:', err);
      return [];
    }
  },

  async getApproved() {
    try {
      const res = await fetch(SHEET_API + '/search?status=approved');
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch approved experts:', err);
      return [];
    }
  },

  async getById(id) {
    try {
      const res = await fetch(SHEET_API + '/search?id=' + encodeURIComponent(id));
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Failed to fetch expert:', err);
      return null;
    }
  },

  async addApplication(data) {
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const row = {
        data: [{
          id,
          name: data.name,
          email: data.email,
          phone: "'" + data.phone,
          category: data.category,
          specialty: data.specialty,
          experience: data.experience,
          qualifications: data.qualifications,
          bio: data.bio,
          price: data.price,
          linkedin: data.linkedin || '',
          status: 'pending',
          rating: '0',
          reviews: '0',
          appliedAt: new Date().toISOString()
        }]
      };
      const res = await fetch(SHEET_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to submit application:', err);
      return { error: true };
    }
  },

  async approve(id) {
    try {
      const res = await fetch(SHEET_API + '/id/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { status: 'approved' } })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to approve:', err);
      return { error: true };
    }
  },

  async reject(id) {
    try {
      const res = await fetch(SHEET_API + '/id/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { status: 'rejected' } })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to reject:', err);
      return { error: true };
    }
  },

  async delete(id) {
    try {
      const res = await fetch(SHEET_API + '/id/' + encodeURIComponent(id), {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to delete:', err);
      return { error: true };
    }
  }
};

// Expert application form handler
const expertForm = document.getElementById('expertForm');
if (expertForm) {
  expertForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = expertForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

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

    const result = await ExpertsDB.addApplication(data);
    if (result.error) {
      btn.disabled = false;
      btn.textContent = 'Submit Application';
      alert('Something went wrong. Please try again.');
      return;
    }
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('successSection').style.display = 'block';
  });
}
