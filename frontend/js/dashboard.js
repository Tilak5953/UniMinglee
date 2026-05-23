document.addEventListener('DOMContentLoaded', () => {
  // Guard clause - verify auth
  if (!Utils.checkAuth()) return;

  // Setup Sidebar overlay and Username details
  Utils.setupCommonLayout();

  // Load All Dashboard components
  loadDashboardData();

  async function loadDashboardData() {
    try {
      // 1. Fetch Current User Details populated with communities & savedEvents
      const userRes = await API.get('/auth/me');
      if (!userRes.success) {
        Toast.error('Failed to load profile data');
        return;
      }
      const user = userRes.user;
      
      // Update Username greetings
      document.getElementById('userName').textContent = user.name.split(' ')[0];
      
      // Update statistics
      document.getElementById('statCommunities').textContent = user.communities ? user.communities.length : 0;
      document.getElementById('statEvents').textContent = user.savedEvents ? user.savedEvents.length : 0;

      // 2. Fetch accepted matches (connections)
      const connectionsRes = await API.get('/matches');
      if (connectionsRes.success) {
        document.getElementById('statConnections').textContent = connectionsRes.connections.length;
      }

      // 3. Fetch messages conversations count
      const convoRes = await API.get('/messages/conversations/list');
      if (convoRes.success) {
        document.getElementById('statMessages').textContent = convoRes.conversations.length;
      }

      // 4. Fetch and render Upcoming Events
      loadUpcomingEvents(user.university);

      // 5. Fetch and render Suggested Communities
      loadSuggestedCommunities(user);

      // 6. Fetch and render Recommended Students
      loadRecommendedStudents();

      // 7. Load Trending Activities
      loadTrendingActivities(user);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Toast.error('Could not load some dashboard features');
    }
  }

  // Fetch campus events
  async function loadUpcomingEvents(university) {
    const container = document.getElementById('upcomingEvents');
    try {
      // Fetch events (sort by date done in backend)
      const res = await API.get(`/events?university=${encodeURIComponent(university)}`);
      
      container.innerHTML = ''; // Clear skeleton
      
      if (!res.success || !res.events || res.events.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 20px; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📅</div>
            <p>No upcoming events at ${university || 'your campus'} yet.</p>
          </div>`;
        return;
      }

      // Slice top 3
      const upcoming = res.events.slice(0, 3);
      upcoming.forEach(event => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const month = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        
        const card = document.createElement('div');
        card.className = 'event-card card';
        card.style.display = 'flex';
        card.style.gap = '16px';
        card.style.alignItems = 'center';
        card.style.marginBottom = '12px';
        card.style.padding = '16px';
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
          <div class="event-date-badge" style="background: var(--gradient-primary); color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 12px; font-weight: 700; font-family: var(--font-heading); flex-shrink: 0;">
            <span style="font-size: 1.15rem; line-height: 1.1;">${day}</span>
            <span style="font-size: 0.7rem; opacity: 0.9;">${month}</span>
          </div>
          <div class="event-info" style="flex: 1;">
            <h4 style="margin: 0 0 4px 0; font-family: var(--font-heading); font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${Utils.escapeHtml(event.title)}</h4>
            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span>📍 ${Utils.escapeHtml(event.venue)}</span>
              <span>•</span>
              <span>${Utils.formatTime(event.date)}</span>
            </div>
            <span class="tag tag-sm">${Utils.escapeHtml(event.category)}</span>
          </div>
        `;
        
        // Link to event detail or redirect
        card.addEventListener('click', () => {
          window.location.href = `events.html?id=${event._id}`;
        });
        
        container.appendChild(card);
      });
    } catch (e) {
      container.innerHTML = '<p class="error-msg">Error loading events</p>';
    }
  }

  // Fetch suggested communities
  async function loadSuggestedCommunities(user) {
    const container = document.getElementById('suggestedCommunities');
    try {
      const res = await API.get('/communities');
      
      container.innerHTML = ''; // Clear skeleton
      
      if (!res.success || !res.communities || res.communities.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No communities found.</p>`;
        return;
      }

      // Filter out communities user has already joined
      const joinedIds = user.communities.map(c => c._id || c);
      const suggestions = res.communities.filter(c => !joinedIds.includes(c._id));

      const displaySuggestions = suggestions.length > 0 ? suggestions : res.communities;
      
      // Slice top 6
      const miniList = displaySuggestions.slice(0, 6);
      
      miniList.forEach(comm => {
        const isJoined = joinedIds.includes(comm._id);
        const card = document.createElement('div');
        card.className = 'community-mini-card card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.textAlign = 'center';
        card.style.padding = '16px';
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
          <div style="font-size: 2.2rem; margin-bottom: 10px;">${comm.icon || '🎯'}</div>
          <h4 style="margin: 0 0 4px 0; font-family: var(--font-heading); font-size: 0.9rem; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%;">${Utils.escapeHtml(comm.name)}</h4>
          <span style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">${comm.membersCount || comm.members.length} members</span>
          <button class="btn ${isJoined ? 'btn-ghost' : 'btn-primary'} btn-sm" style="padding: 6px 12px; font-size: 0.75rem; width: 100%; margin-top: auto;">
            ${isJoined ? 'Joined' : 'Join'}
          </button>
        `;
        
        // Handle join click directly
        const btn = card.querySelector('button');
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (isJoined) {
            window.location.href = `communities.html?id=${comm._id}`;
            return;
          }
          
          btn.disabled = true;
          btn.textContent = 'Joining...';
          const joinRes = await API.post(`/communities/${comm._id}/join`);
          if (joinRes.success) {
            Toast.success(`Joined ${comm.name}!`);
            btn.textContent = 'Joined';
            btn.className = 'btn btn-ghost btn-sm';
            // Increment member count UI locally
            const memberSpan = card.querySelector('span');
            memberSpan.textContent = `${(comm.membersCount || comm.members.length) + 1} members`;
          } else {
            Toast.error(joinRes.message || 'Could not join community');
            btn.disabled = false;
            btn.textContent = 'Join';
          }
        });

        card.addEventListener('click', () => {
          window.location.href = `communities.html?id=${comm._id}`;
        });
        
        container.appendChild(card);
      });
    } catch (e) {
      container.innerHTML = '<p class="error-msg">Error loading communities</p>';
    }
  }

  // Fetch recommended students
  async function loadRecommendedStudents() {
    const container = document.getElementById('recommendedStudents');
    try {
      const res = await API.get('/matches/suggestions');
      
      container.innerHTML = ''; // Clear skeleton
      
      if (!res.success || !res.suggestions || res.suggestions.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 8px;">💫</div>
            <p>Complete your profile tags to unlock high compatibility recommendations.</p>
          </div>`;
        return;
      }

      // Slice top 3
      const list = res.suggestions.slice(0, 3);
      list.forEach(item => {
        const student = item.user;
        const card = document.createElement('div');
        card.className = 'student-card card';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '12px';
        card.style.marginBottom = '12px';
        card.style.padding = '16px';
        
        card.innerHTML = `
          ${Utils.generateAvatar(student, 'avatar-md')}
          <div style="flex: 1;">
            <h4 style="margin: 0 0 2px 0; font-family: var(--font-heading); font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${Utils.escapeHtml(student.name)}</h4>
            <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 140px;">
              ${Utils.escapeHtml(student.university)} • ${Utils.escapeHtml(student.branch)}
            </p>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
              <span class="tag tag-sm" style="background: rgba(108, 99, 255, 0.08); font-size: 0.7rem; font-weight: 700; color: var(--primary);">
                ⚡ ${item.compatibilityScore}% Match
              </span>
            </div>
          </div>
          <button class="btn btn-icon connect-btn" title="Send connection request" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--bg-secondary); color: var(--primary);">
            ➕
          </button>
        `;

        const btn = card.querySelector('.connect-btn');
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          btn.disabled = true;
          btn.textContent = '⏳';
          const requestRes = await API.post(`/matches/${student._id}/request`);
          if (requestRes.success) {
            Toast.success(`Sent connection request to ${student.name}!`);
            btn.textContent = '✓';
            btn.style.background = 'var(--success)';
            btn.style.color = 'white';
            btn.title = 'Request sent';
          } else {
            Toast.error(requestRes.message || 'Could not send request');
            btn.disabled = false;
            btn.textContent = '➕';
          }
        });
        
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          window.location.href = `matching.html?id=${student._id}`;
        });
        
        container.appendChild(card);
      });
    } catch (e) {
      container.innerHTML = '<p class="error-msg">Error loading recommendations</p>';
    }
  }

  // Load trending activities
  function loadTrendingActivities(user) {
    const container = document.getElementById('trendingActivities');
    if (!container) return;

    // Use current interests plus standard ones
    const tags = ['Cozy Gaming', 'Acoustic Jam', 'Web Dev', 'Anime Talk', 'Photography Walk', 'AI Hackathons', 'Literature Club'];
    
    container.innerHTML = '';
    tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.style.margin = '4px';
      span.style.cursor = 'pointer';
      span.textContent = `#${tag}`;
      
      span.addEventListener('click', () => {
        window.location.href = `communities.html?search=${encodeURIComponent(tag)}`;
      });
      container.appendChild(span);
    });
  }

  // Search input redirection handler
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `matching.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
});
