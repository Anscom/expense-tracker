import api from '../config/api';

export const expenseService = {
  getAll: (params = {}) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getTotal: (params = {}) => api.get('/expenses/stats/total', { params }),
  getTodayByCategory: () => api.get('/expenses/today/by-category'),
};
