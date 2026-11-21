import { defineStore } from 'pinia'
import api from 'src/services/api'

export const useAuth = defineStore('auth', {
  state: () => ({ me: null, companies: [], ready: false }),
  getters: {
    isAdmin:   (s) => s.me?.role === 'admin',
    isManager: (s) => ['admin', 'manager'].includes(s.me?.role)
  },
  actions: {
    async load () {
      if (!localStorage.getItem('letters_token')) { this.ready = true; return }
      try {
        const [{ data: me }, { data: companies }] = await Promise.all([
          api.get('/api/users/me'), api.get('/api/companies')
        ])
        this.me = me
        this.companies = companies
      } catch { this.me = null }
      this.ready = true
    },
    setToken (t) { localStorage.setItem('letters_token', t) },
    logout () { localStorage.removeItem('letters_token'); this.me = null; location.href = '/login' }
  }
})
