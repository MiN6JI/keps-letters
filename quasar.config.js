import { configure } from 'quasar/wrappers'

export default configure(() => ({
  boot: ['startup'],
  css: ['app.scss'],
  extras: ['material-icons'],

  build: {
    target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'] },
    vueRouterMode: 'history',
    // Laravel serves the built files from public/ and falls back to index.html.
    distDir: '../letters-laravel/public',
    env: { API_BASE: process.env.API_BASE || '' }
  },

  devServer: {
    port: 9100,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/auth': { target: 'http://localhost:8000', changeOrigin: true }
    }
  },

  framework: {
    config: { brand: { primary: '#1D75BC', secondary: '#155a91', negative: '#b03a2e', positive: '#1d7a4d' } },
    plugins: ['Notify', 'Dialog', 'Loading']
  }
}))
