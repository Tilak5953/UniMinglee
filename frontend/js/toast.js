const Toast = {
  container: null,

  init: () => {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.className = 'toast-container';
      document.body.appendChild(Toast.container);
    }
  },

  show: (message, type = 'info', duration = 3500) => {
    Toast.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">${message}</div>
      <button class="toast-close">&times;</button>
      <div class="toast-progress"></div>
    `;

    Toast.container.appendChild(toast);

    // Trigger animation frame for CSS transition
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Close button listener
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      Toast.dismiss(toast);
    });

    // Progress bar animation
    const progress = toast.querySelector('.toast-progress');
    progress.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => {
      progress.style.width = '0%';
    });

    // Auto dismiss timer
    const dismissTimer = setTimeout(() => {
      Toast.dismiss(toast);
    }, duration);

    // Keep reference in case of hover pausing (optional enhancement)
    toast.dataset.timerId = dismissTimer;
  },

  dismiss: (toast) => {
    if (!toast) return;
    toast.classList.remove('show');
    
    // Clear timer
    if (toast.dataset.timerId) {
      clearTimeout(parseInt(toast.dataset.timerId));
    }

    // Remove element after transition completes
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  },

  success: (message) => Toast.show(message, 'success'),
  error: (message) => Toast.show(message, 'error'),
  info: (message) => Toast.show(message, 'info'),
  warning: (message) => Toast.show(message, 'warning')
};

// Export to window object for global availability
window.Toast = Toast;
