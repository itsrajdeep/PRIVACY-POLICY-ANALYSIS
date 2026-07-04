import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const healthCheck = () => api.get('/health')

export const analyzeText = (text) => api.post('/analyze/text', { text })

export const analyzeUrl = (url) => api.post('/analyze/url', { url })

export const getDatasetStats = () => api.get('/dataset/stats')

export const getCompanies = (params = {}) =>
  api.get('/dataset/companies', { params })

export const getCompany = (name) =>
  api.get(`/dataset/company/${encodeURIComponent(name)}`)

export default api
