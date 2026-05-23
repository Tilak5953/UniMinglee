document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.checkAuth()) return;

  Utils.setupCommonLayout();

  // Local state arrays for tags
  let interestsState = [];
  let skillsState = [];
  let selectedPersonality = 'introvert';

  // Selectors
  const profileForm = document.getElementById('profileForm');
  const nameInput = document.getElementById('nameInput');
  const universityInput = document.getElementById('universityInput');
  const branchInput = document.getElementById('branchInput');
  const yearInput = document.getElementById('yearInput');
  const bioInput = document.getElementById('bioInput');
  
  const profileDisplayName = document.getElementById('profileDisplayName');
  const profileDisplayUni = document.getElementById('profileDisplayUni');
  const profileBadges = document.getElementById('profileBadges');
  const profileAvatarBig = document.getElementById('profileAvatarBig');

  // Load profile data
  loadUserProfile();

  async function loadUserProfile() {
    try {
      const res = await API.get('/auth/me');
      if (!res.success) {
        Toast.error('Could not fetch profile details');
        return;
      }
      const user = res.user;

      // Populate input values
      nameInput.value = user.name || '';
      universityInput.value = user.university || '';
      branchInput.value = user.branch || '';
      yearInput.value = user.year || '1st Year';
      bioInput.value = user.bio || '';

      // Update header details
      profileDisplayName.textContent = user.name;
      profileDisplayUni.textContent = `📍 ${user.university || 'No campus set'}`;
      
      // Update Big avatar
      profileAvatarBig.innerHTML = Utils.generateAvatar(user, 'avatar-xl');

      // Set personality
      selectedPersonality = user.personalityType || 'introvert';
      selectPersonalityCard(selectedPersonality);
      updatePersonalityBadge(selectedPersonality);

      // Populate tags state
      interestsState = [...(user.interests || [])];
      skillsState = [...(user.skills || [])];

      renderInterests();
      renderSkills();

    } catch (e) {
      console.error(e);
      Toast.error('Error rendering profile');
    }
  }

  // Personality Card Selection Handling
  const personalityCards = document.querySelectorAll('.personality-card');
  personalityCards.forEach(card => {
    card.addEventListener('click', () => {
      selectedPersonality = card.getAttribute('data-type');
      selectPersonalityCard(selectedPersonality);
    });
  });

  function selectPersonalityCard(type) {
    personalityCards.forEach(c => c.classList.remove('selected'));
    const targetCard = document.getElementById(`personality-${type}`);
    if (targetCard) targetCard.classList.add('selected');
  }

  function updatePersonalityBadge(type) {
    const emoji = Utils.getPersonalityEmoji(type);
    const color = Utils.getPersonalityColor(type);
    profileBadges.innerHTML = `
      <span class="comfort-badge" style="background-color: ${color}; padding: 6px 12px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; color: white; display: inline-flex; align-items: center; gap: 6px;">
        ${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    `;
  }

  // Tags rendering (Interests)
  const interestsEditor = document.getElementById('interestsEditor');
  const interestTextInput = document.getElementById('interestTextInput');
  const addInterestBtn = document.getElementById('addInterestBtn');

  function renderInterests() {
    interestsEditor.innerHTML = '';
    if (interestsState.length === 0) {
      interestsEditor.innerHTML = '<span style="color: var(--text-light); font-size: 0.85rem;">No interests added yet.</span>';
      return;
    }
    interestsState.forEach(interest => {
      const pill = document.createElement('div');
      pill.className = 'tag-pill';
      pill.innerHTML = `
        <span>${Utils.escapeHtml(interest)}</span>
        <button type="button" class="remove-btn" data-val="${interest}">×</button>
      `;
      pill.querySelector('.remove-btn').addEventListener('click', () => {
        interestsState = interestsState.filter(i => i !== interest);
        renderInterests();
      });
      interestsEditor.appendChild(pill);
    });
  }

  addInterestBtn.addEventListener('click', () => {
    const val = interestTextInput.value.trim();
    if (val && !interestsState.includes(val)) {
      interestsState.push(val);
      interestTextInput.value = '';
      renderInterests();
    }
  });

  interestTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterestBtn.click();
    }
  });

  // Tags rendering (Skills)
  const skillsEditor = document.getElementById('skillsEditor');
  const skillTextInput = document.getElementById('skillTextInput');
  const addSkillBtn = document.getElementById('addSkillBtn');

  function renderSkills() {
    skillsEditor.innerHTML = '';
    if (skillsState.length === 0) {
      skillsEditor.innerHTML = '<span style="color: var(--text-light); font-size: 0.85rem;">No skills added yet.</span>';
      return;
    }
    skillsState.forEach(skill => {
      const pill = document.createElement('div');
      pill.className = 'tag-pill';
      pill.innerHTML = `
        <span>${Utils.escapeHtml(skill)}</span>
        <button type="button" class="remove-btn" data-val="${skill}">×</button>
      `;
      pill.querySelector('.remove-btn').addEventListener('click', () => {
        skillsState = skillsState.filter(s => s !== skill);
        renderSkills();
      });
      skillsEditor.appendChild(pill);
    });
  }

  addSkillBtn.addEventListener('click', () => {
    const val = skillTextInput.value.trim();
    if (val && !skillsState.includes(val)) {
      skillsState.push(val);
      skillTextInput.value = '';
      renderSkills();
    }
  });

  skillTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkillBtn.click();
    }
  });

  // Avatar upload trigger
  const avatarEditBtn = document.getElementById('avatarEditBtn');
  const avatarFileInput = document.getElementById('avatarFileInput');

  avatarEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener('change', async () => {
    const file = avatarFileInput.files[0];
    if (!file) return;

    // Validate size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      Toast.info('Uploading avatar...');
      const res = await API.upload('/users/me/avatar', formData);
      if (res.success) {
        Toast.success('Avatar updated successfully!');
        
        // Update images in page
        profileAvatarBig.innerHTML = Utils.generateAvatar(res.user, 'avatar-xl');
        const navAvatar = document.getElementById('navAvatar');
        if (navAvatar) navAvatar.innerHTML = Utils.generateAvatar(res.user, 'avatar-sm');
        
        // Save in storage
        API.setUser(res.user);
      } else {
        Toast.error(res.message || 'Image upload failed');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Error uploading image file');
    }
  });

  // Save profile submission
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const branch = branchInput.value.trim();
    const year = yearInput.value;
    const bio = bioInput.value.trim();

    if (!name || !branch) {
      Toast.error('Name and branch fields are required');
      return;
    }

    const updateBtn = document.getElementById('saveProfileBtn');
    updateBtn.disabled = true;
    updateBtn.textContent = 'Saving Changes...';

    try {
      const res = await API.put('/users/me', {
        name,
        branch,
        year,
        bio,
        personalityType: selectedPersonality,
        interests: interestsState,
        skills: skillsState
      });

      if (res.success) {
        Toast.success('Profile details saved!');
        API.setUser(res.user);
        
        // Update header views
        profileDisplayName.textContent = res.user.name;
        updatePersonalityBadge(selectedPersonality);
        
        // Update navbar name
        const navName = document.getElementById('navUsername');
        if (navName) navName.textContent = res.user.name;
      } else {
        Toast.error(res.message || 'Could not update profile details');
      }
    } catch (err) {
      console.error(err);
      Toast.error('An error occurred while updating profile');
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = 'Save Profile Changes';
    }
  });

  // Delete account trigger modal
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const deleteModal = document.getElementById('deleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  deleteAccountBtn.addEventListener('click', (e) => {
    e.preventDefault();
    Utils.showModal(deleteModal);
  });

  cancelDeleteBtn.addEventListener('click', () => {
    Utils.hideModal(deleteModal);
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';
    try {
      const res = await API.delete('/users/me');
      if (res.success) {
        Toast.success('Your account has been deleted.');
        API.removeToken();
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        Toast.error(res.message || 'Failed to delete account');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Confirm Delete';
      }
    } catch (err) {
      console.error(err);
      Toast.error('Error deleting account');
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Confirm Delete';
    }
  });
});
