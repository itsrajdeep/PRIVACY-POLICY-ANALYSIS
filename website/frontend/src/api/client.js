import axios from 'axios'

// In production (GitHub Pages), VITE_API_URL points to the Render backend.
// In local dev, it's undefined and Vite proxy forwards '/api' to localhost:5000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const healthCheck = () => api.get('/health')

export const analyzeText = (text) => api.post('/analyze/text', { text })

export const analyzeUrl = (url) => api.post('/analyze/url', { url })

// ── Static data fallback for GitHub Pages (no backend) ───────────────────────
const BASE = import.meta.env.BASE_URL   // e.g. '/PRIVACY-POLICY-ANALYSIS/'

let _staticData = null
async function getStaticData() {
  if (_staticData) return _staticData
  const res = await fetch(`${BASE}data.json`)
  _staticData = await res.json()
  return _staticData
}

export const getDatasetStats = async () => {
  try {
    return await api.get('/dataset/stats')
  } catch {
    const d = await getStaticData()
    return { data: d.stats }
  }
}

export const getCompanies = async (params = {}) => {
  try {
    return await api.get('/dataset/companies', { params })
  } catch {
    const d = await getStaticData()
    let list = [...d.companies]

    // Apply sort
    const { sort = 'score', order = 'desc' } = params
    list.sort((a, b) => {
      let va, vb
      if (sort === 'name')  { va = (a.company || '').toLowerCase(); vb = (b.company || '').toLowerCase() }
      else if (sort === 'label') { va = a.label || ''; vb = b.label || '' }
      else { va = a.obfuscation_score ?? 0; vb = b.obfuscation_score ?? 0 }
      if (va < vb) return order === 'asc' ? -1 : 1
      if (va > vb) return order === 'asc' ? 1 : -1
      return 0
    })

    return { data: { companies: list } }
  }
}

export const getCompany = async (name) => {
  try {
    return await api.get(`/dataset/company/${encodeURIComponent(name)}`)
  } catch {
    const d = await getStaticData()
    const company = d.companies.find(
      c => (c.company || '').toLowerCase() === decodeURIComponent(name).toLowerCase()
    )
    if (!company) throw new Error('Company not found')
    return { data: company }
  }
}

export default api
