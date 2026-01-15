import api from '../config/api';

export const budgetService = {
  getAll: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getPacing: (id) => api.get(`/budgets/${id}/pacing`),
  getOverallSummary: () => api.get('/budgets/summary/overall'),
  getMonthlySummary: () => api.get('/budgets/summary/monthly'),
};
