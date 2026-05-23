const Utils = {
  // Format date: Jan 15, 2025
  formatDate: (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  // Format time: 2:30 PM
  formatTime: (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  // Relative time: '5 min ago', '2 hours ago', etc.
  timeAgo: (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return Utils.formatDate(dateStr);
  },

  // Truncate string
  truncate: (str, len = 100) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  },

  // Get Initials from Name
  getInitials: (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  },

  // Dynamic Avatar Color Generator
  getAvatarColor: (name) => {
    if (!name) return '#6C63FF';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#6C63FF', '#48CAE4', '#FF6B9D', '#10B981', 
      '#F59E0B', '#3f37c9', '#f72585', '#7209b7'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  },

  // Render inline avatar component
  generateAvatar: (user, sizeClass = 'avatar-md') => {
    if (!user) return `<div class="avatar ${sizeClass}">U</div>`;
    
    if (user.profileImage) {
      return `<img src="${user.profileImage}" alt="${user.name}" class="avatar ${sizeClass}">`;
    }
    
    const initials = Utils.getInitials(user.name);
    const color = Utils.getAvatarColor(user.name);
    return `<div class="avatar ${sizeClass}" style="background-color: ${color}">${initials}</div>`;
  },

  // Prevent XSS injection
  escapeHtml: (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Maps personality type details
  getPersonalityEmoji: (type) => {
    if (type === 'introvert') return '🌙';
    if (type === 'ambivert') return '⚡';
    if (type === 'extrovert') return '☀️';
    return '🧠';
  },

  getPersonalityColor: (type) => {
    if (type === 'introvert') return '#6C63FF';
    if (type === 'ambivert') return '#48CAE4';
    if (type === 'extrovert') return '#FF6B9D';
    return '#6B7280';
  },

  getCategoryIcon: (category) => {
    const cats = {
      coding: '💻',
      music: '🎵',
      photography: '📸',
      anime: '🎌',
      sports: '⚽',
      art: '🎨',
      gaming: '🎮',
      literature: '📚',
      science: '🔬',
      technical: '💻',
      cultural: '🎪',
      workshops: '💡',
      hackathons: '🚀',
      other: '🎯'
    };
    return cats[category.toLowerCase()] || '🎯';
  },

  // Auth checks
  checkAuth: () => {
    if (!API.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  // Dynamic theme management (Defaults to eye-friendly Dark Mode)
  setupTheme: () => {
    let theme = localStorage.getItem('theme');
    if (!theme) {
      theme = 'dark';
      localStorage.setItem('theme', 'dark');
    }

    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }

    // Dynamic placement of Theme Toggle Button inside Navbar
    const navbarRight = document.querySelector('.app-navbar .navbar-right');
    if (navbarRight && !document.getElementById('themeToggleBtn')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'themeToggleBtn';
      toggleBtn.className = 'btn-icon theme-toggle-btn';
      toggleBtn.title = 'Toggle Color Theme';
      toggleBtn.style.marginRight = '8px';
      toggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';

      toggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
          document.documentElement.classList.add('light-theme');
          toggleBtn.innerHTML = '🌙';
        } else {
          document.documentElement.classList.remove('light-theme');
          toggleBtn.innerHTML = '☀️';
        }
      });

      navbarRight.insertBefore(toggleBtn, navbarRight.firstChild);
    }
  },

  // Global layout logic binding (sidebars, navbar data, logout)
  setupCommonLayout: () => {
    // 0. Initialize theme setup
    Utils.setupTheme();

    // 1. Populate navbar user info
    const currentUser = API.getUser();
    if (currentUser) {
      const navAvatar = document.getElementById('navAvatar');
      const navUsername = document.getElementById('navUsername');
      if (navAvatar) navAvatar.innerHTML = Utils.generateAvatar(currentUser, 'avatar-sm');
      if (navUsername) navUsername.textContent = currentUser.name;
    }

    // 2. Mobile Sidebar binds
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggleBtn && sidebar && overlay) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    // 3. Logout listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        API.removeToken();
        localStorage.removeItem('user');
        window.location.href = '/login.html';
      });
    }
  },

  // Modal helpers to control fade/scale animations
  showModal: (modalEl) => {
    if (!modalEl) return;
    modalEl.style.display = 'flex';
    // Trigger layout reflow to enable transition animation
    void modalEl.offsetHeight;
    modalEl.classList.add('open');
  },

  hideModal: (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    // Hide the display block only after fade transition ends (300ms)
    setTimeout(() => {
      if (!modalEl.classList.contains('open')) {
        modalEl.style.display = 'none';
      }
    }, 300);
  }
};

window.Utils = Utils;
