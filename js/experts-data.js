// Tapanta - Expert Data Management (Firebase Firestore backend)

// Build expert card image HTML: use photo if available, otherwise category icon
function expertImgHtml(name, category, photo) {
  if (photo) {
    return '<div class="expert-card__img"><img src="' + photo + '" alt="' + (name || '') + '" style="width:100%;height:100%;object-fit:cover;"></div>';
  }
  var icon = (typeof getSubIcon === 'function') ? getSubIcon(category) : '👤';
  return '<div class="expert-card__img">' + icon + '</div>';
}

// Wait for Firebase to be ready
function getDB() {
  return firebase.firestore();
}

const ExpertsDB = {
  async getAll() {
    try {
      const snap = await getDB().collection('experts').get();
      var docs = snap.docs.map(doc => doc.data());
      docs.sort(function(a, b) {
        return (b.appliedAt || '').localeCompare(a.appliedAt || '');
      });
      return docs;
    } catch (err) {
      console.error('Failed to fetch experts:', err);
      return [];
    }
  },

  async getApproved() {
    try {
      const snap = await getDB().collection('experts')
        .where('status', '==', 'approved')
        .get();
      return snap.docs.map(doc => doc.data());
    } catch (err) {
      console.error('Failed to fetch approved experts:', err);
      return [];
    }
  },

  async getById(id) {
    try {
      const snap = await getDB().collection('experts')
        .where('id', '==', id)
        .get();
      return snap.docs.length > 0 ? snap.docs[0].data() : null;
    } catch (err) {
      console.error('Failed to fetch expert:', err);
      return null;
    }
  },

  async addApplication(data) {
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const expert = {
        id: id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        gender: data.gender || '',
        category: data.category || '',
        specialty: data.specialty || '',
        experience: data.experience || '0',
        qualifications: data.qualifications || '',
        bio: data.bio || '',
        price: data.price || '0',
        linkedin: data.linkedin || '',
        photo: data.photo || '',
        availDays: data.availDays || '',
        availFrom: data.availFrom || '',
        availTo: data.availTo || '',
        status: 'pending',
        rating: '0',
        reviews: '0',
        appliedAt: new Date().toISOString()
      };
      await getDB().collection('experts').doc(id).set(expert);
      return { success: true, id: id };
    } catch (err) {
      console.error('Failed to submit application:', err);
      return { error: true };
    }
  },

  async approve(id) {
    try {
      const snap = await getDB().collection('experts').where('id', '==', id).get();
      if (snap.docs.length > 0) {
        await snap.docs[0].ref.update({ status: 'approved' });
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to approve:', err);
      return { error: true };
    }
  },

  async reject(id) {
    try {
      const snap = await getDB().collection('experts').where('id', '==', id).get();
      if (snap.docs.length > 0) {
        await snap.docs[0].ref.update({ status: 'rejected' });
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to reject:', err);
      return { error: true };
    }
  },

  async delete(id) {
    try {
      const snap = await getDB().collection('experts').where('id', '==', id).get();
      if (snap.docs.length > 0) {
        await snap.docs[0].ref.delete();
      }
      return { success: true };
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

    // Convert photo to base64 if provided
    let photoBase64 = '';
    const photoFile = document.getElementById('photoUpload') ? document.getElementById('photoUpload').files[0] : null;
    if (photoFile) {
      photoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(photoFile);
      });
    }

    const data = {
      name: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      gender: document.getElementById('gender').value,
      category: document.getElementById('category').value,
      specialty: document.getElementById('specialty').value.trim(),
      experience: document.getElementById('experience').value,
      qualifications: document.getElementById('qualifications').value.trim(),
      bio: document.getElementById('bio').value.trim(),
      price: document.getElementById('price').value,
      linkedin: document.getElementById('linkedin').value.trim(),
      photo: photoBase64,
      availDays: Array.from(document.querySelectorAll('input[name="days"]:checked')).map(function(c){return c.value;}).join(', '),
      availFrom: document.getElementById('availFrom').value,
      availTo: document.getElementById('availTo').value
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
