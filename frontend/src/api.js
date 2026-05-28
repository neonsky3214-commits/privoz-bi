import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getRevenueSummary  = (period) => api.get('/revenue/summary', { params: { period } }).then(r => r.data)
export const getRevenueMonthly  = ()       => api.get('/revenue/monthly').then(r => r.data)
export const getRevenueByTenant = (period) => api.get('/revenue/by-tenant', { params: { period } }).then(r => r.data)
export const getTenants         = (period) => api.get('/tenants/', { params: { period } }).then(r => r.data)
export const getTraffic         = ()       => api.get('/traffic/summary').then(r => r.data)
export const getDelivery        = (period) => api.get('/delivery/summary', { params: { period } }).then(r => r.data)
export const getMarketing       = ()       => api.get('/marketing/social').then(r => r.data)
export const getAds             = ()       => api.get('/marketing/ads').then(r => r.data)
export const getComplaints      = (period) => api.get('/ops/complaints', { params: { period } }).then(r => r.data)
export const getNPS             = ()       => api.get('/ops/nps').then(r => r.data)
export const getForecast        = ()       => api.get('/forecast/revenue').then(r => r.data)
export const uploadExcel        = (file)   => {
  const fd = new FormData(); fd.append('file', file)
  return api.post('/upload/excel', fd).then(r => r.data)
}
export const uploadGSheets      = (url)    => api.post('/upload/google-sheets', null, { params: { url } }).then(r => r.data)
