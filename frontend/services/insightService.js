import api from '../config/api';

export const insightService = {
  getWeekly: () => api.get('/insights/weekly'),
  getStreak: () => api.get('/insights/streak'),
  getReview: () => api.get('/insights/review'),
};
