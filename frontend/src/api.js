import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('bi_token')
  if (token) cfg.headers['X-Token'] = token
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bi_token')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export default api

export const login               = (pwd)    => api.post('/auth/login', { password: pwd }).then(r => r.data)
export const getRevenueSummary   = (p)      => api.get('/revenue/summary', { params: { period: p } }).then(r => r.data)
export const getRevenueMonthly   = ()       => api.get('/revenue/monthly').then(r => r.data)
export const getTenants          = (p)      => api.get('/tenants/', { params: { period: p } }).then(r => r.data)
export const getTraffic          = ()       => api.get('/traffic/summary').then(r => r.data)
export const getDelivery         = (p)      => api.get('/delivery/summary', { params: { period: p } }).then(r => r.data)
export const getMarketing        = ()       => api.get('/marketing/social').then(r => r.data)
export const getAds              = ()       => api.get('/marketing/ads').then(r => r.data)
export const getComplaints       = (p)      => api.get('/ops/complaints', { params: { period: p } }).then(r => r.data)
export const getNPS              = ()       => api.get('/ops/nps').then(r => r.data)
export const getForecast         = ()       => api.get('/forecast/revenue').then(r => r.data)
export const getAlerts           = (p)      => api.get('/alerts/', { params: { period: p } }).then(r => r.data)
export const getEvents           = ()       => api.get('/events/').then(r => r.data)
export const saveEvent           = (d)      => api.post('/events/', d).then(r => r.data)
export const deleteEvent         = (id)     => api.delete(`/events/${id}`).then(r => r.data)
export const sendTelegramTest    = ()       => api.post('/telegram/test').then(r => r.data)
export const getTelegramSettings = ()       => api.get('/telegram/settings').then(r => r.data)
export const saveTelegramSettings= (d)      => api.post('/telegram/settings', d).then(r => r.data)
export const uploadFile          = (file, section) => {
  const fd = new FormData(); fd.append('file', file)
  return api.post('/upload/excel', fd, { params: { section } }).then(r => r.data)
}
export const uploadGSheets = (url, section) =>
  api.post('/upload/google-sheets', null, { params: { url, section } }).then(r => r.data)
