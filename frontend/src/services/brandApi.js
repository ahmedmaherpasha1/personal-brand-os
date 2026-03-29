import api from './api';

export const getBrandAnalysis = () => api.get('/brand/analysis');

export const generateBrandAnalysis = () => api.post('/brand/analyze');
