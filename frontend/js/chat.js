document.addEventListener('DOMContentLoaded', () => {
  // 1. Guard check - Verify user is authenticated
  if (!Utils.checkAuth()) return;

  // 2. Setup Sidebar overlays, Username details and Logouts
  Utils.setupCommonLayout();

  // State Management
  let activeUserId = null;
  let conversationsList = [];
  let currentMessagesCount = 0;
  let pollingTimer = null;
  let conversationPollingTimer = null;

  // DOM Elements
  const chatLayoutContainer = document.getElementById('chatLayoutContainer');
  const conversationListContainer = document.getElementById('conversationList');
  const searchChatUserInput = document.getElementById('searchChatUserInput');
  const noChatSelectedPane = document.getElementById('noChatSelectedPane');
  
  // Active Chat Header Elements
  const activeChatAvatarWrap = document.getElementById('activeChatAvatarWrap');
  const activeChatName = document.getElementById('activeChatName');
  const activeChatStatus = document.getElementById('activeChatStatus');
  const viewDetailProfileBtn = document.getElementById('viewDetailProfileBtn');
  const chatBackBtn = document.getElementById('chatBackBtn');
  
  // Message Log and Controls Elements
  const chatMessagesContainer = document.getElementById('chatMessages');
  const messageTextBox = document.getElementById('messageTextBox');
  const chatInputForm = document.getElementById('chatInputForm');
  const emojiPanelToggle = document.getElementById('emojiPanelToggle');
  const emojiPanel = document.getElementById('emojiPanel');

  // Parse URL query parameter: checks if we are redirected to chat with a user
  const urlParams = new URLSearchParams(window.location.search);
  const paramUserId = urlParams.get('userId');

  // Initialize
  init();

  async function init() {
    setupDetailModalMarkup();
    setupEventListeners();
    await fetchConversations(true); // Load conversation list and auto-select query param user if present
    
    // Start active polling loops
    startPolling();
  }

  // Set up event listeners
  function setupEventListeners() {
    // Search filter contacts
    searchChatUserInput.addEventListener('input', () => {
      renderConversations();
    });

    // Form submission
    chatInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });

    // Emoji panel toggle
    emojiPanelToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPanel.classList.toggle('open');
    });

    // Emoji clicks
    document.querySelectorAll('.emoji-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const emoji = e.target.textContent;
        messageTextBox.value += emoji;
        emojiPanel.classList.remove('open');
        messageTextBox.focus();
      });
    });

    // Close emoji panel on outside click
    document.addEventListener('click', (e) => {
      if (!emojiPanel.contains(e.target) && e.target !== emojiPanelToggle) {
        emojiPanel.classList.remove('open');
      }
    });

    // Back button in mobile view
    chatBackBtn.addEventListener('click', () => {
      chatLayoutContainer.classList.remove('active-chat');
      // Deselect active conversation in sidebar
      document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
      activeUserId = null;
      noChatSelectedPane.style.display = 'flex';
      
      // Remove query parameter from URL to prevent re-opening on refresh
      const newUrl = window.location.pathname;
      window.history.pushState({}, '', newUrl);
    });

    // View classmate detailed profile modal
    viewDetailProfileBtn.addEventListener('click', () => {
      if (activeUserId) {
        openActiveUserProfileModal();
      }
    });
  }

  // Start polling functions for real-time messages & active lists
  function startPolling() {
    // Poll message history every 3 seconds for active conversation
    pollingTimer = setInterval(() => {
      if (activeUserId) {
        fetchChatHistory(activeUserId, false);
      }
    }, 3000);

    // Poll conversation list every 5 seconds
    conversationPollingTimer = setInterval(() => {
      fetchConversations(false);
    }, 5000);
  }

  // Clear timers on page leave
  window.addEventListener('beforeunload', () => {
    if (pollingTimer) clearInterval(pollingTimer);
    if (conversationPollingTimer) clearInterval(conversationPollingTimer);
  });

  // Fetch all conversations list
  async function fetchConversations(isInitial = false) {
    try {
      const res = await API.get('/messages/conversations/list');
      if (res.success) {
        conversationsList = res.conversations;

        // Handle case where we click "Chat" from Matching on a student who we don't have conversation history with
        if (isInitial && paramUserId) {
          const alreadyInList = conversationsList.some(convo => convo.user._id === paramUserId);
          if (!alreadyInList) {
            // Fetch that user's info to add to sidebar
            const userRes = await API.get(`/users/${paramUserId}`);
            if (userRes.success) {
              const dummyConvo = {
                user: userRes.user,
                lastMessage: 'Tap to start connecting...',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                isSimulated: true
              };
              conversationsList.unshift(dummyConvo);
              activeUserId = paramUserId;
            }
          } else {
            activeUserId = paramUserId;
          }
        }

        renderConversations();

        // If active user is selected, render active pane
        if (activeUserId) {
          const activeConvo = conversationsList.find(c => c.user._id === activeUserId);
          if (activeConvo) {
            selectUserChat(activeConvo.user, isInitial);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }

  // Render conversations sidebar
  function renderConversations() {
    const filter = searchChatUserInput.value.trim().toLowerCase();
    
    // Clear current listing
    const skeletons = conversationListContainer.querySelectorAll('.skeleton-card');
    skeletons.forEach(s => s.remove());
    
    // Get non-skeleton items
    const existingItems = conversationListContainer.querySelectorAll('.conversation-item:not(.skeleton-card)');
    existingItems.forEach(item => item.remove());

    const filteredConvos = conversationsList.filter(convo => 
      convo.user.name.toLowerCase().includes(filter)
    );

    if (filteredConvos.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.textAlign = 'center';
      emptyItem.style.padding = '24px 12px';
      emptyItem.style.color = 'var(--text-secondary)';
      emptyItem.style.fontSize = '0.85rem';
      emptyItem.innerHTML = 'No chats found.<br><span style="font-size: 0.75rem; color:var(--text-light)">Connect with classmates in Matching!</span>';
      conversationListContainer.appendChild(emptyItem);
      return;
    }

    filteredConvos.forEach(convo => {
      const user = convo.user;
      const isActive = user._id === activeUserId;
      const isOnline = user.isOnline;

      const item = document.createElement('div');
      item.className = `conversation-item ${isActive ? 'active' : ''}`;
      item.setAttribute('data-user-id', user._id);

      // Create avatar wrap containing badge/status
      const avatarHTML = Utils.generateAvatar(user, 'avatar-md');
      const statusDot = `<span class="avatar-status ${isOnline ? 'online' : 'offline'}"></span>`;
      
      const timeStr = convo.isSimulated ? '' : Utils.timeAgo(convo.lastMessageTime);
      const unreadBadge = convo.unreadCount > 0 ? `<span class="conversation-badge">${convo.unreadCount}</span>` : '';

      item.innerHTML = `
        <div style="position: relative; flex-shrink: 0;">
          ${avatarHTML}
          ${statusDot}
        </div>
        <div class="conversation-info">
          <div class="conversation-header-row">
            <span class="conversation-name">${Utils.escapeHtml(user.name)}</span>
            <span class="conversation-time">${timeStr}</span>
          </div>
          <div class="conversation-preview-row">
            <span class="conversation-last-msg">${Utils.escapeHtml(convo.lastMessage || '')}</span>
            ${unreadBadge}
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        selectUserChat(user);
      });

      conversationListContainer.appendChild(item);
    });
  }

  // Activate specific chat history thread
  function selectUserChat(user, scrollImmediate = true) {
    activeUserId = user._id;

    // Highlight selected in sidebar
    document.querySelectorAll('.conversation-item').forEach(el => {
      if (el.getAttribute('data-user-id') === user._id) {
        el.classList.add('active');
        // Clear unread badge locally
        const badge = el.querySelector('.conversation-badge');
        if (badge) badge.remove();
      } else {
        el.classList.remove('active');
      }
    });

    // Toggle Mobile responsive layout classes
    chatLayoutContainer.classList.add('active-chat');
    noChatSelectedPane.style.display = 'none';

    // Set header info
    activeChatAvatarWrap.innerHTML = Utils.generateAvatar(user, 'avatar-sm');
    activeChatName.textContent = user.name;
    activeChatStatus.textContent = user.isOnline ? 'Online' : 'Offline';
    if (user.isOnline) {
      activeChatStatus.className = 'chat-header-status online';
    } else {
      activeChatStatus.className = 'chat-header-status';
    }

    // Set URL query param
    const newUrl = `${window.location.pathname}?userId=${user._id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Fetch conversation messages
    fetchChatHistory(user._id, scrollImmediate);
  }

  // Fetch Message Logs between users
  async function fetchChatHistory(chatUserId, shouldScrollToBottom = false) {
    if (!chatUserId) return;
    try {
      const res = await API.get(`/messages/${chatUserId}`);
      if (res.success) {
        const messages = res.messages;
        
        // Detect if count of messages has changed before rendering to avoid screen flashing
        if (messages.length !== currentMessagesCount || shouldScrollToBottom) {
          renderMessages(messages);
          currentMessagesCount = messages.length;
          scrollToBottom();
        }
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  }

  // Render bubble messages list
  function renderMessages(messages) {
    chatMessagesContainer.innerHTML = '';
    const loggedInUser = API.getUser();

    if (messages.length === 0) {
      chatMessagesContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 24px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🛋️</div>
          <p style="font-weight: 500;">Start a quiet, friendly dialogue</p>
          <p style="font-size: 0.8rem; color: var(--text-light); max-width: 250px; margin-top: 4px;">Say hello! Take your time and make connections at a comfortable speed.</p>
        </div>`;
      return;
    }

    messages.forEach(msg => {
      const isSent = msg.sender === loggedInUser._id;
      const bubbleWrapper = document.createElement('div');
      bubbleWrapper.className = `message-bubble-wrapper ${isSent ? 'sent' : 'received'}`;
      
      const timeStr = Utils.formatTime(msg.createdAt);

      bubbleWrapper.innerHTML = `
        <div class="message-bubble">
          ${Utils.escapeHtml(msg.content)}
        </div>
        <span class="message-time">${timeStr}</span>
      `;
      
      chatMessagesContainer.appendChild(bubbleWrapper);
    });
  }

  // Scroll message thread container to bottom
  function scrollToBottom() {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // Send message submit trigger
  async function sendMessage() {
    const content = messageTextBox.value.trim();
    if (!content || !activeUserId) return;

    // Clear textbox instantly
    messageTextBox.value = '';

    // Append to list locally immediately for zero-latency feeling UX
    appendLocalSentBubble(content);
    scrollToBottom();

    try {
      const res = await API.post('/messages', {
        receiver: activeUserId,
        content
      });

      if (res.success) {
        // Increment message count locally
        currentMessagesCount++;
        
        // Refresh conversations list to update sidebar preview message
        fetchConversations(false);
      } else {
        Toast.error('Message failed to deliver');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Network error sending message');
    }
  }

  // Local bubble appender helper
  function appendLocalSentBubble(content) {
    // If empty state exists, remove it
    if (chatMessagesContainer.querySelector('p')) {
      chatMessagesContainer.innerHTML = '';
    }

    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = 'message-bubble-wrapper sent';
    
    const nowTime = new Date().toISOString();
    const timeStr = Utils.formatTime(nowTime);

    bubbleWrapper.innerHTML = `
      <div class="message-bubble">
        ${Utils.escapeHtml(content)}
      </div>
      <span class="message-time">${timeStr}</span>
    `;
    
    chatMessagesContainer.appendChild(bubbleWrapper);
  }

  // Create Student Detail Review Modal overlay structure programmatically
  function setupDetailModalMarkup() {
    if (document.getElementById('studentDetailModal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'studentDetailModal';
    overlay.style.display = 'none';
    overlay.style.zIndex = '2000';

    overlay.innerHTML = `
      <div class="modal" style="position: relative; max-height: 90vh; overflow-y: auto;">
        <button class="modal-close" id="closeDetailModalBtn" style="position: absolute; top: 16px; right: 16px; font-size: 1.5rem; background: none; border: none; cursor: pointer; color: var(--text-secondary);">×</button>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <div id="modalAvatarWrap" style="display: flex; justify-content: center; margin-top: 10px;"></div>
          <h3 id="modalName" style="margin: 12px 0 4px 0; font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--text-primary);"></h3>
          <p id="modalUni" style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);"></p>
          <p id="modalBranch" style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-secondary);"></p>
          <div id="modalBadgeWrap" style="margin-top: 8px;"></div>
        </div>

        <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
          <h4 style="margin: 0 0 6px 0; font-family: var(--font-heading); font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Bio</h4>
          <p id="modalBio" style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;"></p>
        </div>

        <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Comfortable Interests</h4>
          <div id="modalInterests" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Skills & Hobbies</h4>
          <div id="modalSkills" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
        </div>

        <button class="btn btn-secondary" id="closeDetailModalBtnBottom" style="width: 100%;">Close Details</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Binds close actions
    const closeBtn = overlay.querySelector('#closeDetailModalBtn');
    const closeBtnBottom = overlay.querySelector('#closeDetailModalBtnBottom');
    
    const closeModal = () => { Utils.hideModal(overlay); };
    
    closeBtn.addEventListener('click', closeModal);
    closeBtnBottom.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  }

  // Open detailed profile modal logic
  async function openActiveUserProfileModal() {
    if (!activeUserId) return;

    try {
      const res = await API.get(`/users/${activeUserId}`);
      if (!res.success) {
        Toast.error('Could not load classmate details');
        return;
      }

      const student = res.user;
      const modal = document.getElementById('studentDetailModal');
      
      const avatarWrap = modal.querySelector('#modalAvatarWrap');
      const nameEl = modal.querySelector('#modalName');
      const uniEl = modal.querySelector('#modalUni');
      const branchEl = modal.querySelector('#modalBranch');
      const badgeWrap = modal.querySelector('#modalBadgeWrap');
      const bioEl = modal.querySelector('#modalBio');
      const interestsEl = modal.querySelector('#modalInterests');
      const skillsEl = modal.querySelector('#modalSkills');

      // Populate details
      avatarWrap.innerHTML = Utils.generateAvatar(student, 'avatar-xl');
      nameEl.textContent = student.name;
      uniEl.textContent = `📍 ${student.university}`;
      branchEl.textContent = `${student.branch} • ${student.year}`;
      bioEl.textContent = student.bio || "No biography details shared.";

      // Personality Badge
      const pType = student.personalityType || 'introvert';
      const pEmoji = Utils.getPersonalityEmoji(pType);
      const pColor = Utils.getPersonalityColor(pType);
      badgeWrap.innerHTML = `
        <span class="comfort-badge" style="background-color: ${pColor}; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; color: white;">
          ${pEmoji} ${pType.charAt(0).toUpperCase() + pType.slice(1)}
        </span>
      `;

      // Interests
      interestsEl.innerHTML = '';
      if (student.interests && student.interests.length > 0) {
        student.interests.forEach(interest => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = interest;
          interestsEl.appendChild(span);
        });
      } else {
        interestsEl.innerHTML = '<span style="font-size:0.8rem; color:var(--text-light)">None listed</span>';
      }

      // Skills
      skillsEl.innerHTML = '';
      if (student.skills && student.skills.length > 0) {
        student.skills.forEach(skill => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.style.background = 'rgba(72, 202, 228, 0.08)';
          span.style.color = 'var(--secondary)';
          span.textContent = skill;
          skillsEl.appendChild(span);
        });
      } else {
        skillsEl.innerHTML = '<span style="font-size:0.8rem; color:var(--text-light)">None listed</span>';
      }

      // Open Modal view overlay
      Utils.showModal(modal);

    } catch (e) {
      console.error(e);
      Toast.error('An unexpected error occurred opening details');
    }
  }
});
