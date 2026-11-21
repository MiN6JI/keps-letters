const routes = [
  { path: '/login', component: () => import('pages/LoginPage.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'generate', name: 'generate', component: () => import('pages/GeneratePage.vue') },
      { path: 'files', name: 'files', component: () => import('pages/FilesPage.vue') },
      { path: 'queue', name: 'queue', component: () => import('pages/QueuePage.vue') },
      { path: 'templates', name: 'templates', component: () => import('pages/TemplatesPage.vue') },
      { path: 'admin', name: 'admin', component: () => import('pages/AdminPage.vue'), meta: { admin: true } },
      { path: 'settings', name: 'settings', component: () => import('pages/SettingsPage.vue') }
    ]
  },
  { path: '/:catchAll(.*)*', redirect: '/' }
]
export default routes
