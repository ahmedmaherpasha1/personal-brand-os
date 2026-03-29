import api from './api';

export const getPublishingQueue = () => api.get('/publishing/queue');

export const reschedulePost = (id, scheduledAt) =>
  api.put(`/publishing/queue/${id}/reschedule`, { scheduled_at: scheduledAt });

export const markAsCopied = (id) => api.put(`/publishing/queue/${id}/copied`);
