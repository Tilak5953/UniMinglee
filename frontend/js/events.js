document.addEventListener('DOMContentLoaded', () => {
  if (!Utils.checkAuth()) return;

  Utils.setupCommonLayout();

  // State Management
  let eventsList = [];
  let userSavedIds = [];
  let currentUserId = '';
  
  let activeCategory = 'all';
  let searchQuery = '';
  let activeFilterType = 'upcoming'; // 'upcoming', 'saved', 'registered'

  // Dom selectors
  const eventsGrid = document.getElementById('eventsGrid');
  const searchEventInput = document.getElementById('searchEventInput');
  const categoryFilterContainer = document.getElementById('categoryFilterContainer');
  const eventsSortSelect = document.getElementById('eventsSortSelect');

  // Modal selectors
  const openCreateEventModalBtn = document.getElementById('openCreateEventModalBtn');
  const createEventModal = document.getElementById('createEventModal');
  const closeEventModalBtn = document.getElementById('closeEventModalBtn');
  const createEventForm = document.getElementById('createEventForm');

  // Event Details Modal selectors
  const eventDetailsModal = document.getElementById('eventDetailsModal');
  const closeDetailsModalBtn = document.getElementById('closeDetailsModalBtn');

  // Check URL parameters for direct event ID detail highlight
  const urlParams = new URLSearchParams(window.location.search);
  const paramEventId = urlParams.get('id');

  // Load User details first to extract bookmarks & saved IDs
  loadUserAndFetchEvents();

  async function loadUserAndFetchEvents() {
    try {
      const userRes = await API.get('/auth/me');
      if (userRes.success) {
        currentUserId = userRes.user._id;
        userSavedIds = userRes.user.savedEvents.map(e => e._id || e);
      }
      await fetchEvents();
    } catch (e) {
      console.error(e);
      Toast.error('Error loading events setup');
    }
  }

  async function fetchEvents() {
    try {
      const res = await API.get('/events');
      if (res.success) {
        eventsList = res.events;
        renderEvents();
        
        // If query parameters suggest opening a specific event:
        if (paramEventId) {
          openEventDetails(paramEventId);
        }
      } else {
        Toast.error('Could not fetch events');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Network error fetching campus events');
    }
  }

  function renderEvents() {
    eventsGrid.innerHTML = '';

    // Filtering logic
    const filtered = eventsList.filter(event => {
      // 1. Category check
      const categoryMatch = activeCategory === 'all' || event.category.toLowerCase() === activeCategory.toLowerCase();
      
      // 2. Search check
      const queryMatch = event.title.toLowerCase().includes(searchQuery) ||
                         event.venue.toLowerCase().includes(searchQuery) ||
                         (event.description && event.description.toLowerCase().includes(searchQuery)) ||
                         event.category.toLowerCase().includes(searchQuery);

      // 3. Tab filter check
      let filterMatch = true;
      if (activeFilterType === 'saved') {
        filterMatch = userSavedIds.includes(event._id);
      } else if (activeFilterType === 'registered') {
        filterMatch = event.registeredUsers.includes(currentUserId);
      }

      return categoryMatch && queryMatch && filterMatch;
    });

    if (filtered.length === 0) {
      eventsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 12px;">📅</div>
          <h3>No events found</h3>
          <p>Be the first to host an event under this category!</p>
        </div>`;
      return;
    }

    filtered.forEach(event => {
      const isSaved = userSavedIds.includes(event._id);
      const isRegistered = event.registeredUsers.includes(currentUserId);
      const eventDate = new Date(event.date);
      
      const day = eventDate.getDate();
      const month = eventDate.toLocaleString('en-US', { month: 'short' });
      const timeStr = Utils.formatTime(event.date);
      const dateStr = Utils.formatDate(event.date);

      const card = document.createElement('div');
      card.id = `event-card-${event._id}`;
      card.className = `event-card card ${event.category.toLowerCase()}`;

      // Build card cover (image or background color class default)
      const bannerHtml = event.image 
        ? `<img src="${event.image}" alt="${Utils.escapeHtml(event.title)}">` 
        : '';

      card.innerHTML = `
        <div class="event-card-banner">
          ${bannerHtml}
          <div class="event-date-badge">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
          </div>
          <button class="event-save-btn ${isSaved ? 'saved' : ''}" title="${isSaved ? 'Unsave event' : 'Save event'}">
            ${isSaved ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="event-card-content">
          <span class="event-card-category">${event.category}</span>
          <h3 class="event-card-title">${Utils.escapeHtml(event.title)}</h3>
          <p class="event-card-description">${Utils.escapeHtml(event.description || 'No description provided.')}</p>
          
          <div class="event-card-meta">
            <div class="event-meta-item">
              <span>📍</span> <span>${Utils.escapeHtml(event.venue)}</span>
            </div>
            <div class="event-meta-item">
              <span>🕒</span> <span>${dateStr} at ${timeStr}</span>
            </div>
          </div>

          <div class="event-card-footer">
            <div class="event-card-attendees">
              <span class="event-attendee-count">👥 ${event.registeredUsers.length} / ${event.maxAttendees} attending</span>
            </div>
            <button class="btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} btn-sm register-event-btn">
              ${isRegistered ? 'Registered ✓' : 'Register'}
            </button>
          </div>
        </div>
      `;

      // Event bookmark toggle
      const saveBtn = card.querySelector('.event-save-btn');
      saveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        saveBtn.disabled = true;
        
        try {
          const res = await API.post(`/events/${event._id}/save`);
          if (res.success) {
            if (res.isSaved) {
              Toast.success('Event saved to bookmarks');
              userSavedIds.push(event._id);
              saveBtn.innerHTML = '❤️';
              saveBtn.classList.add('saved');
            } else {
              Toast.success('Event removed from bookmarks');
              userSavedIds = userSavedIds.filter(id => id !== event._id);
              saveBtn.innerHTML = '🤍';
              saveBtn.classList.remove('saved');
              
              // If we are on bookmarked filter tab, immediately remove card from grid
              if (activeFilterType === 'saved') {
                card.remove();
                if (eventsGrid.children.length === 0) renderEvents();
              }
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          saveBtn.disabled = false;
        }
      });

      // Event registration toggle
      const registerBtn = card.querySelector('.register-event-btn');
      registerBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        registerBtn.disabled = true;
        registerBtn.textContent = isRegistered ? 'Deregistering...' : 'Registering...';

        try {
          const res = await API.post(`/events/${event._id}/register`);
          if (res.success) {
            if (res.isRegistered) {
              Toast.success(`Registered for ${event.title}!`);
            } else {
              Toast.success(`Cancelled registration for ${event.title}`);
            }
            // Fetch updated list to re-sync state counts & views
            fetchEvents();
          } else {
            Toast.error(res.message || 'Registration failed');
            registerBtn.disabled = false;
            registerBtn.textContent = isRegistered ? 'Registered ✓' : 'Register';
          }
        } catch (err) {
          console.error(err);
          registerBtn.disabled = false;
          registerBtn.textContent = isRegistered ? 'Registered ✓' : 'Register';
        }
      });

      // Click card to view event details
      card.addEventListener('click', () => {
        openEventDetails(event._id);
      });

      eventsGrid.appendChild(card);
    });
  }

  // Search input handler
  searchEventInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderEvents();
  });

  // Category filter pills
  categoryFilterContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    categoryFilterContainer.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');

    activeCategory = pill.getAttribute('data-category');
    renderEvents();
  });

  // Sort/Filter drop select
  eventsSortSelect.addEventListener('change', (e) => {
    activeFilterType = e.target.value;
    renderEvents();
  });

  // Modal open/close actions
  openCreateEventModalBtn.addEventListener('click', () => {
    Utils.showModal(createEventModal);
  });

  closeEventModalBtn.addEventListener('click', () => {
    Utils.hideModal(createEventModal);
    createEventForm.reset();
  });

  // Host Event Submit Handler
  createEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value.trim();
    const category = document.getElementById('eventCategory').value;
    const maxAttendees = document.getElementById('eventMaxAttendees').value;
    const date = document.getElementById('eventDate').value;
    const venue = document.getElementById('eventVenue').value.trim();
    const description = document.getElementById('eventDesc').value.trim();
    const fileInput = document.getElementById('eventImageFile');

    if (!title || !category || !date || !venue || !description) {
      Toast.error('Please enter all required fields');
      return;
    }

    // Date validator
    if (new Date(date) < new Date()) {
      Toast.error('Event date must be in the future');
      return;
    }

    const saveBtn = document.getElementById('saveEventBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Hosting Event...';

    // Build form data to support file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('maxAttendees', maxAttendees);
    formData.append('date', date);
    formData.append('venue', venue);
    formData.append('description', description);
    
    if (fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const res = await API.upload('/events', formData);
      if (res.success) {
        Toast.success(`Successfully hosted ${title}!`);
        Utils.hideModal(createEventModal);
        createEventForm.reset();
        
        // Refresh grid
        fetchEvents();
      } else {
        Toast.error(res.message || 'Failed to create event');
      }
    } catch (err) {
      console.error(err);
      Toast.error('An error occurred while hosting event');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Host Event';
    }
  });

  // Event Details Modal Close handlers
  closeDetailsModalBtn.addEventListener('click', () => {
    Utils.hideModal(eventDetailsModal);
  });
  eventDetailsModal.addEventListener('click', (e) => {
    if (e.target === eventDetailsModal) {
      Utils.hideModal(eventDetailsModal);
    }
  });

  // Open Event Details Modal
  async function openEventDetails(eventId) {
    try {
      const res = await API.get(`/events/${eventId}`);
      if (!res.success) {
        Toast.error('Could not load event details');
        return;
      }
      const event = res.event;

      const detailEventBanner = document.getElementById('detailEventBanner');
      const detailEventBannerImg = document.getElementById('detailEventBannerImg');
      const detailEventCategory = document.getElementById('detailEventCategory');
      const detailEventTitle = document.getElementById('detailEventTitle');
      const detailEventVenue = document.getElementById('detailEventVenue');
      const detailEventDateTime = document.getElementById('detailEventDateTime');
      const detailEventDesc = document.getElementById('detailEventDesc');
      const detailOrganizerAvatar = document.getElementById('detailOrganizerAvatar');
      const detailOrganizerName = document.getElementById('detailOrganizerName');
      const detailOrganizerEmail = document.getElementById('detailOrganizerEmail');
      const detailChatOrganizerBtn = document.getElementById('detailChatOrganizerBtn');
      const detailAttendanceCount = document.getElementById('detailAttendanceCount');
      const detailAttendanceProgress = document.getElementById('detailAttendanceProgress');
      const detailAttendeesList = document.getElementById('detailAttendeesList');
      const detailSaveBtn = document.getElementById('detailSaveBtn');
      const detailRegisterBtn = document.getElementById('detailRegisterBtn');

      // Banner gradient / cover image
      detailEventBanner.className = '';
      detailEventBanner.style.background = '';
      if (event.image) {
        detailEventBannerImg.src = event.image;
        detailEventBannerImg.style.display = 'block';
      } else {
        detailEventBannerImg.style.display = 'none';
        const gradients = {
          technical: 'linear-gradient(135deg, #6C63FF 0%, #3a0ca3 100%)',
          cultural: 'linear-gradient(135deg, #FF6B9D 0%, #c9184a 100%)',
          sports: 'linear-gradient(135deg, #48CAE4 0%, #0077b6 100%)',
          workshops: 'linear-gradient(135deg, #10B981 0%, #064e3b 100%)',
          hackathons: 'linear-gradient(135deg, #7209b7 0%, #3f37c9 100%)'
        };
        detailEventBanner.style.background = gradients[event.category.toLowerCase()] || 'var(--gradient-primary)';
      }

      detailEventCategory.textContent = event.category;
      detailEventCategory.className = `tag ${event.category.toLowerCase()}`;
      detailEventTitle.textContent = event.title;
      detailEventVenue.textContent = event.venue;
      detailEventDateTime.textContent = `${Utils.formatDate(event.date)} at ${Utils.formatTime(event.date)}`;
      detailEventDesc.textContent = event.description || 'No description provided.';

      // Filter out null/undefined registered users to prevent crash on deleted users
      const validAttendees = (event.registeredUsers || []).filter(u => u !== null && u !== undefined);

      // Organizer details
      const organizer = event.organizer || { name: 'Unknown User', email: 'N/A' };
      detailOrganizerAvatar.innerHTML = Utils.generateAvatar(event.organizer, 'avatar-md');
      detailOrganizerName.textContent = organizer.name;
      detailOrganizerEmail.textContent = organizer.email;

      // Chat Button
      if (organizer._id && organizer._id === currentUserId) {
        detailChatOrganizerBtn.style.display = 'none';
      } else if (organizer._id) {
        detailChatOrganizerBtn.style.display = 'inline-flex';
        detailChatOrganizerBtn.onclick = () => {
          window.location.href = `chat.html?userId=${organizer._id}`;
        };
      } else {
        detailChatOrganizerBtn.style.display = 'none';
      }

      // Attendance
      const attendeesCount = validAttendees.length;
      detailAttendanceCount.textContent = `${attendeesCount} / ${event.maxAttendees} attending`;
      const progressPercent = Math.min((attendeesCount / event.maxAttendees) * 100, 100);
      detailAttendanceProgress.style.width = `${progressPercent}%`;

      // Attendees
      detailAttendeesList.innerHTML = '';
      if (validAttendees.length > 0) {
        validAttendees.forEach(attendee => {
          const avatarWrap = document.createElement('div');
          avatarWrap.style.position = 'relative';
          const avatarHtml = Utils.generateAvatar(attendee, 'avatar-sm');
          avatarWrap.innerHTML = avatarHtml;
          if (avatarWrap.firstChild) {
            avatarWrap.firstChild.setAttribute('title', `${attendee.name || 'Unknown'} (${attendee.university || 'Uni'})`);
          }
          detailAttendeesList.appendChild(avatarWrap);
        });
      } else {
        detailAttendeesList.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-light); font-style: italic;">No one has registered yet. Be the first!</span>';
      }

      // Bookmark action
      const isSaved = userSavedIds.includes(event._id);
      detailSaveBtn.innerHTML = isSaved ? 'Bookmarked ❤️' : 'Bookmark 🤍';
      detailSaveBtn.onclick = async () => {
        detailSaveBtn.disabled = true;
        try {
          const saveRes = await API.post(`/events/${event._id}/save`);
          if (saveRes.success) {
            if (saveRes.isSaved) {
              Toast.success('Event saved to bookmarks');
              userSavedIds.push(event._id);
              detailSaveBtn.innerHTML = 'Bookmarked ❤️';
            } else {
              Toast.success('Event removed from bookmarks');
              userSavedIds = userSavedIds.filter(id => id !== event._id);
              detailSaveBtn.innerHTML = 'Bookmark 🤍';
            }
            fetchEvents(); // refresh grid list
          }
        } catch (err) {
          console.error(err);
        } finally {
          detailSaveBtn.disabled = false;
        }
      };

      // Register action
      const isRegistered = validAttendees.some(u => {
        const id = u._id || u;
        return id.toString() === currentUserId.toString();
      });
      detailRegisterBtn.innerHTML = isRegistered ? 'Registered ✓' : 'Register';
      detailRegisterBtn.className = `btn ${isRegistered ? 'btn-secondary' : 'btn-primary'}`;
      detailRegisterBtn.onclick = async () => {
        detailRegisterBtn.disabled = true;
        detailRegisterBtn.textContent = isRegistered ? 'Deregistering...' : 'Registering...';
        try {
          const regRes = await API.post(`/events/${event._id}/register`);
          if (regRes.success) {
            if (regRes.isRegistered) {
              Toast.success(`Registered for ${event.title}!`);
            } else {
              Toast.success(`Cancelled registration for ${event.title}`);
            }
            Utils.hideModal(eventDetailsModal);
            fetchEvents(); // refresh grid list
          } else {
            Toast.error(regRes.message || 'Registration failed');
            detailRegisterBtn.disabled = false;
            detailRegisterBtn.textContent = isRegistered ? 'Registered ✓' : 'Register';
          }
        } catch (err) {
          console.error(err);
          detailRegisterBtn.disabled = false;
          detailRegisterBtn.textContent = isRegistered ? 'Registered ✓' : 'Register';
        }
      };

      Utils.showModal(eventDetailsModal);
    } catch (err) {
      console.error(err);
      Toast.error('An error occurred loading event details');
    }
  }
});
