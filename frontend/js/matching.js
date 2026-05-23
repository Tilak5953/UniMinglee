document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.checkAuth()) return;

  Utils.setupCommonLayout();

  // State Management
  let suggestionsList = [];
  let connectionsList = [];
  let pendingList = [];
  
  let searchQuery = '';
  let activeTab = 'paneSuggestions';
  const sentRequestsLocalIds = []; // Track who we sent requests to in this session

  // Selectors
  const searchInput = document.getElementById('searchStudentsInput');
  const pendingBadge = document.getElementById('pendingRequestsBadge');
  
  // Grid containers
  const suggestionsGrid = document.getElementById('suggestionsGrid');
  const connectionsGrid = document.getElementById('connectionsGrid');
  const pendingGrid = document.getElementById('pendingGrid');

  // Modal Selectors
  const studentDetailModal = document.getElementById('studentDetailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const modalAvatarWrap = document.getElementById('modalAvatarWrap');
  const modalName = document.getElementById('modalName');
  const modalUni = document.getElementById('modalUni');
  const modalBranch = document.getElementById('modalBranch');
  const modalBadgeWrap = document.getElementById('modalBadgeWrap');
  const modalBio = document.getElementById('modalBio');
  const modalInterests = document.getElementById('modalInterests');
  const modalSkills = document.getElementById('modalSkills');
  const modalActionWrap = document.getElementById('modalActionWrap');

  // URL search query check (from dashboard search or tags)
  const urlParams = new URLSearchParams(window.location.search);
  const paramSearch = urlParams.get('search');
  if (paramSearch) {
    searchInput.value = paramSearch;
    searchQuery = paramSearch.toLowerCase();
  }

  // Initial load
  loadTabContent();
  updatePendingBadgeCount();

  // Tab switching navigation listeners
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetPaneId = btn.getAttribute('data-target');
      activeTab = targetPaneId;

      const panes = document.querySelectorAll('.matching-view-pane');
      panes.forEach(pane => {
        if (pane.id === targetPaneId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      loadTabContent();
    });
  });

  // Search input change listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    filterAndRenderCurrentTab();
  });

  async function loadTabContent() {
    updatePendingBadgeCount();

    if (activeTab === 'paneSuggestions') {
      await fetchSuggestions();
    } else if (activeTab === 'paneConnections') {
      await fetchConnections();
    } else if (activeTab === 'panePending') {
      await fetchPendingRequests();
    }
  }

  function filterAndRenderCurrentTab() {
    if (activeTab === 'paneSuggestions') {
      renderSuggestions();
    } else if (activeTab === 'paneConnections') {
      renderConnections();
    } else if (activeTab === 'panePending') {
      renderPendingRequests();
    }
  }

  // Count pending badge indicator
  async function updatePendingBadgeCount() {
    try {
      const res = await API.get('/matches?status=pending');
      if (res.success && res.connections.length > 0) {
        pendingBadge.textContent = res.connections.length;
        pendingBadge.style.display = 'inline-block';
      } else {
        pendingBadge.style.display = 'none';
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Suggestions Fetch
  async function fetchSuggestions() {
    try {
      const res = await API.get('/matches/suggestions');
      if (res.success) {
        suggestionsList = res.suggestions;
        renderSuggestions();
      } else {
        Toast.error('Could not load suggestions');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Error fetching matches recommendations');
    }
  }

  function renderSuggestions() {
    suggestionsGrid.innerHTML = '';

    const filtered = suggestionsList.filter(item => {
      const s = item.user;
      return s.name.toLowerCase().includes(searchQuery) ||
             s.branch.toLowerCase().includes(searchQuery) ||
             (s.interests && s.interests.some(i => i.toLowerCase().includes(searchQuery))) ||
             (s.skills && s.skills.some(sk => sk.toLowerCase().includes(searchQuery)));
    });

    if (filtered.length === 0) {
      suggestionsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">💫</div>
          <p>No matching student suggestions found.</p>
        </div>`;
      return;
    }

    filtered.forEach(item => {
      const s = item.user;
      const card = document.createElement('div');
      card.className = 'match-card card';
      card.style.cursor = 'pointer';

      // Personality emoji
      const pEmoji = Utils.getPersonalityEmoji(s.personalityType);
      const isSent = sentRequestsLocalIds.includes(s._id);

      card.innerHTML = `
        <div class="match-compatibility-badge">
          <span>⚡ ${item.compatibilityScore}% Compatibility</span>
        </div>
        <div class="match-card-avatar">
          ${Utils.generateAvatar(s, 'avatar-lg')}
        </div>
        <h4 class="match-card-name">${Utils.escapeHtml(s.name)}</h4>
        <p class="match-card-uni">${Utils.escapeHtml(s.university)}</p>
        <p class="match-card-branch">${Utils.escapeHtml(s.branch)} • ${Utils.escapeHtml(s.year)}</p>
        <p class="match-card-bio">${Utils.escapeHtml(s.bio || 'Hello! Let\'s connect.')}</p>
        <div class="match-card-interests">
          <span class="tag tag-sm" style="background: var(--bg-secondary);">${pEmoji} ${s.personalityType}</span>
          ${s.interests.slice(0, 2).map(interest => `<span class="tag tag-sm">${Utils.escapeHtml(interest)}</span>`).join('')}
        </div>
        <div class="match-card-actions">
          <button class="btn ${isSent ? 'btn-ghost' : 'btn-primary'} match-card-btn connect-btn" ${isSent ? 'disabled' : ''}>
            ${isSent ? 'Request Sent ✓' : 'Connect'}
          </button>
        </div>
      `;

      // Handle card click to open detail Modal
      card.addEventListener('click', () => {
        openStudentDetailModal(s, 'suggestion', { score: item.compatibilityScore, isSent });
      });

      // Connect Button Click Handler
      const connBtn = card.querySelector('.connect-btn');
      connBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        connBtn.disabled = true;
        connBtn.textContent = 'Sending...';

        try {
          const res = await API.post(`/matches/${s._id}/request`);
          if (res.success) {
            Toast.success(`Connection request sent to ${s.name}!`);
            sentRequestsLocalIds.push(s._id);
            connBtn.textContent = 'Request Sent ✓';
            connBtn.className = 'btn btn-ghost match-card-btn';
          } else {
            Toast.error(res.message || 'Request failed');
            connBtn.disabled = false;
            connBtn.textContent = 'Connect';
          }
        } catch (err) {
          console.error(err);
          connBtn.disabled = false;
          connBtn.textContent = 'Connect';
        }
      });

      suggestionsGrid.appendChild(card);
    });
  }

  // Active Connections Fetch
  async function fetchConnections() {
    try {
      const res = await API.get('/matches');
      if (res.success) {
        connectionsList = res.connections;
        renderConnections();
      } else {
        Toast.error('Could not load connections');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Error fetching friends list');
    }
  }

  function renderConnections() {
    connectionsGrid.innerHTML = '';

    const filtered = connectionsList.filter(item => {
      const s = item.user;
      return s.name.toLowerCase().includes(searchQuery) ||
             s.branch.toLowerCase().includes(searchQuery) ||
             (s.interests && s.interests.some(i => i.toLowerCase().includes(searchQuery)));
    });

    if (filtered.length === 0) {
      connectionsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🤝</div>
          <p>No connected friends found yet.</p>
        </div>`;
      return;
    }

    filtered.forEach(item => {
      const s = item.user;
      const card = document.createElement('div');
      card.className = 'connection-card card';
      card.style.cursor = 'pointer';

      card.innerHTML = `
        ${Utils.generateAvatar(s, 'avatar-md')}
        <div class="connection-info">
          <h4 style="margin:0 0 2px 0; font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700;">${Utils.escapeHtml(s.name)}</h4>
          <p style="margin:0; font-size: 0.75rem; color: var(--text-secondary);">${Utils.escapeHtml(s.university)} • ${Utils.escapeHtml(s.branch)}</p>
        </div>
        <button class="btn btn-primary connection-action-btn chat-btn">
          Chat
        </button>
      `;

      card.addEventListener('click', () => {
        openStudentDetailModal(s, 'connection', { matchId: item.matchId });
      });

      card.querySelector('.chat-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `chat.html?userId=${s._id}`;
      });

      connectionsGrid.appendChild(card);
    });
  }

  // Pending Invites Fetch
  async function fetchPendingRequests() {
    try {
      const res = await API.get('/matches?status=pending');
      if (res.success) {
        pendingList = res.connections;
        renderPendingRequests();
      } else {
        Toast.error('Could not load incoming requests');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Error fetching match requests');
    }
  }

  function renderPendingRequests() {
    pendingGrid.innerHTML = '';

    const filtered = pendingList.filter(item => {
      const s = item.user;
      return s.name.toLowerCase().includes(searchQuery) ||
             s.branch.toLowerCase().includes(searchQuery);
    });

    if (filtered.length === 0) {
      pendingGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📩</div>
          <p>No pending connection requests.</p>
        </div>`;
      return;
    }

    filtered.forEach(item => {
      const s = item.user;
      const card = document.createElement('div');
      card.className = 'connection-card card';
      card.style.cursor = 'pointer';

      card.innerHTML = `
        ${Utils.generateAvatar(s, 'avatar-md')}
        <div class="connection-info">
          <h4 style="margin:0 0 2px 0; font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700;">${Utils.escapeHtml(s.name)}</h4>
          <p style="margin:0; font-size: 0.75rem; color: var(--text-secondary);">${Utils.escapeHtml(s.university)} • ${Utils.escapeHtml(s.branch)}</p>
        </div>
        <div class="pending-actions">
          <button class="pending-btn accept" title="Accept request">✓</button>
          <button class="pending-btn reject" title="Ignore request">✕</button>
        </div>
      `;

      card.addEventListener('click', () => {
        openStudentDetailModal(s, 'pending', { matchId: item.matchId });
      });

      // Accept Handler
      card.querySelector('.accept').addEventListener('click', async (e) => {
        e.stopPropagation();
        await respondToMatchRequest(item.matchId, 'accepted', s.name);
      });

      // Reject Handler
      card.querySelector('.reject').addEventListener('click', async (e) => {
        e.stopPropagation();
        await respondToMatchRequest(item.matchId, 'rejected', s.name);
      });

      pendingGrid.appendChild(card);
    });
  }

  async function respondToMatchRequest(matchId, status, studentName) {
    try {
      const res = await API.put(`/matches/${matchId}`, { status });
      if (res.success) {
        if (status === 'accepted') {
          Toast.success(`Connected with ${studentName}!`);
        } else {
          Toast.info(`Ignored connection request from ${studentName}`);
        }
        // Reload pending tab
        loadTabContent();
      } else {
        Toast.error(res.message || 'Error responding to request');
      }
    } catch (e) {
      console.error(e);
      Toast.error('An unexpected error occurred');
    }
  }

  // Profile Details Review Modal Render
  function openStudentDetailModal(student, role, meta = {}) {
    Utils.showModal(studentDetailModal);

    // Set avatar
    modalAvatarWrap.innerHTML = Utils.generateAvatar(student, 'avatar-xl');
    modalName.textContent = student.name;
    modalUni.textContent = `📍 ${student.university}`;
    modalBranch.textContent = `${student.branch} • ${student.year}`;
    modalBio.textContent = student.bio || "No biography details shared.";

    // Render personality comfort badge
    const pType = student.personalityType || 'introvert';
    const pEmoji = Utils.getPersonalityEmoji(pType);
    const pColor = Utils.getPersonalityColor(pType);
    modalBadgeWrap.innerHTML = `
      <span class="comfort-badge" style="background-color: ${pColor}; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; color: white;">
        ${pEmoji} ${pType.charAt(0).toUpperCase() + pType.slice(1)}
      </span>
    `;

    // Render Interests Tags
    modalInterests.innerHTML = '';
    if (student.interests && student.interests.length > 0) {
      student.interests.forEach(interest => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = interest;
        modalInterests.appendChild(span);
      });
    } else {
      modalInterests.innerHTML = '<span style="font-size:0.8rem; color:var(--text-light)">None listed</span>';
    }

    // Render Skills Tags
    modalSkills.innerHTML = '';
    if (student.skills && student.skills.length > 0) {
      student.skills.forEach(skill => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.style.background = 'rgba(72, 202, 228, 0.08)';
        span.style.color = 'var(--secondary)';
        span.textContent = skill;
        modalSkills.appendChild(span);
      });
    } else {
      modalSkills.innerHTML = '<span style="font-size:0.8rem; color:var(--text-light)">None listed</span>';
    }

    // Modal Actions Area Builder
    modalActionWrap.innerHTML = '';

    if (role === 'connection') {
      const chatBtn = document.createElement('button');
      chatBtn.className = 'btn btn-primary';
      chatBtn.style.width = '100%';
      chatBtn.textContent = 'Message Student';
      chatBtn.addEventListener('click', () => {
        window.location.href = `chat.html?userId=${student._id}`;
      });
      modalActionWrap.appendChild(chatBtn);
    } 
    else if (role === 'pending') {
      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '12px';
      
      const acc = document.createElement('button');
      acc.className = 'btn btn-primary';
      acc.style.flex = '1';
      acc.textContent = 'Accept Invite';
      acc.addEventListener('click', async () => {
        Utils.hideModal(studentDetailModal);
        await respondToMatchRequest(meta.matchId, 'accepted', student.name);
      });

      const rej = document.createElement('button');
      rej.className = 'btn btn-secondary';
      rej.style.flex = '1';
      rej.style.borderColor = 'var(--danger)';
      rej.style.color = 'var(--danger)';
      rej.textContent = 'Ignore';
      rej.addEventListener('click', async () => {
        Utils.hideModal(studentDetailModal);
        await respondToMatchRequest(meta.matchId, 'rejected', student.name);
      });

      btnRow.appendChild(rej);
      btnRow.appendChild(acc);
      modalActionWrap.appendChild(btnRow);
    } 
    else if (role === 'suggestion') {
      const conn = document.createElement('button');
      conn.className = `btn ${meta.isSent ? 'btn-ghost' : 'btn-primary'}`;
      conn.style.width = '100%';
      conn.textContent = meta.isSent ? 'Request Sent ✓' : 'Connect';
      conn.disabled = meta.isSent;

      if (!meta.isSent) {
        conn.addEventListener('click', async () => {
          conn.disabled = true;
          conn.textContent = 'Sending...';
          const res = await API.post(`/matches/${student._id}/request`);
          if (res.success) {
            Toast.success(`Connection request sent to ${student.name}!`);
            sentRequestsLocalIds.push(student._id);
            conn.textContent = 'Request Sent ✓';
            conn.className = 'btn btn-ghost';
            // Reload grid suggests
            fetchSuggestions();
          } else {
            Toast.error(res.message || 'Request failed');
            conn.disabled = false;
            conn.textContent = 'Connect';
          }
        });
      }
      modalActionWrap.appendChild(conn);
    }
  }

  // Modal closer
  closeDetailModalBtn.addEventListener('click', () => {
    Utils.hideModal(studentDetailModal);
  });

  studentDetailModal.addEventListener('click', (e) => {
    if (e.target === studentDetailModal) {
      Utils.hideModal(studentDetailModal);
    }
  });
});
