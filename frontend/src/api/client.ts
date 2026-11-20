import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser
    ? (window.sessionStorage?.getItem('token') || window.localStorage?.getItem('token'))
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeCompanyId = isBrowser
    ? (window.sessionStorage?.getItem('active_company_id') || window.localStorage?.getItem('active_company_id'))
    : null;
  if (activeCompanyId) {
    config.headers['x-company-id'] = activeCompanyId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
        try {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('active_company_id');
          sessionStorage.removeItem('wegrow_current_student_session');
          localStorage.removeItem('token');
          localStorage.removeItem('active_company_id');
          localStorage.removeItem('user');
          localStorage.removeItem('wegrow_remember_me');
          localStorage.removeItem('wegrow_current_student_session');
        } catch (_) {}
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
