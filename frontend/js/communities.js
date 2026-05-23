document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.checkAuth()) return;

  Utils.setupCommonLayout();

  // State Management
  let communitiesList = [];
  let userJoinedIds = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let selectedEmoji = '💻';

  // Dom Elements
  const communitiesGrid = document.getElementById('communitiesGrid');
  const searchBarInput = document.getElementById('searchBarInput');
  const categoryFilterContainer = document.getElementById('categoryFilterContainer');
  
  // Modal Elements
  const openCreateModalBtn = document.getElementById('openCreateModalBtn');
  const createCommunityModal = document.getElementById('createCommunityModal');
  const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
  const createCommunityForm = document.getElementById('createCommunityForm');
  const emojiPicker = document.getElementById('emojiPicker');

  // URL search query check (from dashboard search or tags)
  const urlParams = new URLSearchParams(window.location.search);
  const paramSearch = urlParams.get('search');
  if (paramSearch) {
    searchBarInput.value = paramSearch;
    searchQuery = paramSearch.toLowerCase();
  }

  // Load user data first (to find joined communities)
  loadUserDataAndFetchCommunities();

  async function loadUserDataAndFetchCommunities() {
    try {
      const userRes = await API.get('/auth/me');
      if (userRes.success) {
        // Collect joined IDs
        userJoinedIds = userRes.user.communities.map(c => c._id || c);
      }
      
      await fetchCommunities();
    } catch (e) {
      console.error(e);
      Toast.error('Error fetching student setup');
    }
  }

  async function fetchCommunities() {
    try {
      const res = await API.get('/communities');
      if (res.success) {
        communitiesList = res.communities;
        renderCommunities();
      } else {
        Toast.error('Could not load communities');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Network error loading groups');
    }
  }

  function renderCommunities() {
    communitiesGrid.innerHTML = '';
    
    // Filtering logic
    const filtered = communitiesList.filter(comm => {
      const matchCategory = activeCategory === 'all' || comm.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = comm.name.toLowerCase().includes(searchQuery) || 
                          (comm.description && comm.description.toLowerCase().includes(searchQuery)) ||
                          (comm.category && comm.category.toLowerCase().includes(searchQuery));
      return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      communitiesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3>No communities found</h3>
          <p>Try searching for a different keyword or category.</p>
        </div>`;
      return;
    }

    filtered.forEach(comm => {
      const isJoined = userJoinedIds.includes(comm._id);
      
      const card = document.createElement('div');
      card.id = `community-card-${comm._id}`;
      // Set category class for dynamic styling colors
      card.className = `community-card card ${comm.category.toLowerCase()}`;
      
      card.innerHTML = `
        <div class="community-card-banner">
          <div class="community-card-icon-wrap">
            ${comm.icon || '🎯'}
          </div>
        </div>
        <div class="community-card-content">
          <h3 class="community-card-title">${Utils.escapeHtml(comm.name)}</h3>
          <p class="community-card-description">${Utils.escapeHtml(comm.description || 'No description provided.')}</p>
          <div class="community-card-meta">
            <span class="community-card-members">
              👥 ${comm.membersCount || comm.members.length} members
            </span>
            <button class="btn ${isJoined ? 'btn-secondary' : 'btn-primary'} btn-sm join-leave-btn">
              ${isJoined ? 'Leave' : 'Join'}
            </button>
          </div>
        </div>
      `;

      // Handle Join/Leave triggers
      const actionBtn = card.querySelector('.join-leave-btn');
      actionBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        actionBtn.disabled = true;
        
        if (isJoined) {
          actionBtn.textContent = 'Leaving...';
          const leaveRes = await API.post(`/communities/${comm._id}/leave`);
          if (leaveRes.success) {
            Toast.success(`Left ${comm.name}`);
            userJoinedIds = userJoinedIds.filter(id => id !== comm._id);
            // Refresh list
            fetchCommunities();
          } else {
            Toast.error(leaveRes.message || 'Error leaving group');
            actionBtn.disabled = false;
            actionBtn.textContent = 'Leave';
          }
        } else {
          actionBtn.textContent = 'Joining...';
          const joinRes = await API.post(`/communities/${comm._id}/join`);
          if (joinRes.success) {
            Toast.success(`Joined ${comm.name}!`);
            userJoinedIds.push(comm._id);
            // Refresh list
            fetchCommunities();
          } else {
            Toast.error(joinRes.message || 'Error joining group');
            actionBtn.disabled = false;
            actionBtn.textContent = 'Join';
          }
        }
      });

      communitiesGrid.appendChild(card);
    });

    // Handle direct ID parameter redirect scrolling and highlights
    const paramId = urlParams.get('id');
    if (paramId) {
      setTimeout(() => {
        const targetCard = document.getElementById(`community-card-${paramId}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('highlighted');
        }
      }, 150);
    }
  }

  // Categories Filtering Pills Handler
  categoryFilterContainer.addEventListener('click', (e) => {
    const filterPill = e.target.closest('.filter-pill');
    if (!filterPill) return;

    // Toggle active styles
    categoryFilterContainer.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    filterPill.classList.add('active');

    activeCategory = filterPill.getAttribute('data-category');
    renderCommunities();
  });

  // Search Input Handler
  searchBarInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderCommunities();
  });

  // Modal handlers
  openCreateModalBtn.addEventListener('click', () => {
    Utils.showModal(createCommunityModal);
  });

  closeCreateModalBtn.addEventListener('click', () => {
    Utils.hideModal(createCommunityModal);
    createCommunityForm.reset();
    resetEmojiSelection();
  });

  // Emoji picker selector
  emojiPicker.addEventListener('click', (e) => {
    const opt = e.target.closest('.emoji-option');
    if (!opt) return;

    emojiPicker.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
    opt.classList.add('selected');
    selectedEmoji = opt.getAttribute('data-val');
  });

  function resetEmojiSelection() {
    emojiPicker.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
    const def = emojiPicker.querySelector('.emoji-option[data-val="💻"]');
    if (def) def.classList.add('selected');
    selectedEmoji = '💻';
  }

  // Create Community Submission Form
  createCommunityForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('communityName').value.trim();
    const category = document.getElementById('communityCategory').value;
    const description = document.getElementById('communityDesc').value.trim();

    if (!name || !category || !description) {
      Toast.error('Please fill in all community details');
      return;
    }

    const saveBtn = document.getElementById('saveCommunityBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Creating Club...';

    try {
      const res = await API.post('/communities', {
        name,
        category,
        description,
        icon: selectedEmoji
      });

      if (res.success) {
        Toast.success(`Successfully created ${name}!`);
        Utils.hideModal(createCommunityModal);
        createCommunityForm.reset();
        resetEmojiSelection();
        
        // Auto-join newly created community local cache
        userJoinedIds.push(res.community._id);
        
        // Refresh communities grid
        fetchCommunities();
      } else {
        Toast.error(res.message || 'Error creating community');
      }
    } catch (err) {
      console.error(err);
      Toast.error('An unexpected error occurred');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Create Club';
    }
  });
});
