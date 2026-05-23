const API = {
  BASE_URL: '', // Relative paths for same-origin backend hosting

  getToken: () => {
    return localStorage.getItem('token');
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  request: async (method, endpoint, data = null, isFormData = false) => {
    const token = API.getToken();
    const url = `${API.BASE_URL}/api${endpoint}`;

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      method,
      headers
    };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      // Auto logout on unauthorized (401)
      if (response.status === 401) {
        API.removeToken();
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return { success: false, message: 'Session expired. Please log in again.' };
      }

      const resData = await response.json();
      return resData;
    } catch (error) {
      console.error(`API Request Error [${method} ${endpoint}]:`, error);
      return { success: false, message: 'Network error. Please try again later.' };
    }
  },

  get: (endpoint) => API.request('GET', endpoint),
  post: (endpoint, data) => API.request('POST', endpoint, data),
  put: (endpoint, data) => API.request('PUT', endpoint, data),
  delete: (endpoint) => API.request('DELETE', endpoint),
  upload: (endpoint, formData) => API.request('POST', endpoint, formData, true)
};

// Export to window object for global availability
window.API = API;
