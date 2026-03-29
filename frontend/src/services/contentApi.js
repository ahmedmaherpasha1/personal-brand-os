import api from './api';

export const getContentPlan = () => api.get('/content/plan');

export const generateContentPlan = () => api.post('/content/generate-plan');

export const getPost = (id) => api.get(`/content/posts/${id}`);

export const updatePost = (id, data) => api.put(`/content/posts/${id}`, data);

export const approvePost = (id) => api.post(`/content/posts/${id}/approve`);

export const regeneratePost = (id) => api.post(`/content/posts/${id}/regenerate`);
