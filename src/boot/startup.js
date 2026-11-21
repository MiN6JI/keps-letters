import { boot } from 'quasar/wrappers'
import { useAuth } from 'src/stores/auth'

/** Microsoft returns to "/?token=…". Capture it, clean the URL, then load the profile. */
export default boot(async ({ router, store }) => {
  const token = new URLSearchParams(location.search).get('token')
  if (token) {
    localStorage.setItem('letters_token', token)
    history.replaceState({}, '', location.pathname)
  }
  const auth = useAuth(store)
  await auth.load()

  router.beforeEach((to) => {
    if (to.meta.public) return true
    if (!auth.me) return { path: '/login' }
    if (to.meta.admin && !auth.isAdmin) return { path: '/' }
    return true
  })
})
