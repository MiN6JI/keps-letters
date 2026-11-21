import axios from 'axios'
import { Notify } from 'quasar'
import mockAdapter from './mockAdapter'

// Set to true for dummy frontend-only mode, or false to use the Laravel backend API
const DUMMY_MODE = true

const api = axios.create({
  baseURL: process.env.API_BASE || '',
  adapter: DUMMY_MODE ? mockAdapter : undefined
})

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('letters_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // The server re-checks the account on every request, so a 401 can mean the person
    // was just deactivated (or removed from Microsoft) mid-session.
    if (err.response?.status === 401) {
      localStorage.removeItem('letters_token')
      if (!location.pathname.startsWith('/login')) location.href = '/login?expired=1'
    }
    err.friendly = err.response?.data?.error || err.message || 'Something went wrong.'
    return Promise.reject(err)
  }
)

/** Fetch a PDF with the bearer token and open it in a new tab. */
export async function openBlob (url) {
  const res = await api.get(url, { responseType: 'blob' })
  const objUrl = URL.createObjectURL(res.data)
  window.open(objUrl, '_blank')
  setTimeout(() => URL.revokeObjectURL(objUrl), 60000)
}

/** Render a template preview into a bare window: page images, no toolbar, view-only. */
export async function openTemplatePreview (formatId) {
  try {
    const { data } = await api.get(`/api/formats/${formatId}/preview`)
    const w = window.open('', '_blank')
    if (!w) { Notify.create({ type: 'warning', message: 'Allow pop-ups to view the template.' }); return }
    if (data.pages?.length) {
      w.document.write('<title>Template preview</title><body style="margin:0;background:#4a4f57;text-align:center">' +
        data.pages.map((p) => `<img src="${p}" style="display:block;margin:14px auto;max-width:94%;box-shadow:0 3px 14px rgba(0,0,0,.4)">`).join('') + '</body>')
    } else if (data.pdf) {
      w.document.write(`<title>Template preview</title><body style="margin:0"><iframe src="${data.pdf}#toolbar=0" style="border:0;width:100vw;height:100vh"></iframe></body>`)
    }
    w.document.close()
  } catch (e) {
    Notify.create({ type: 'negative', message: e.friendly || 'Could not render the preview.' })
  }
}

export function toast (message, type = 'positive') { Notify.create({ type, message }) }
export default api
