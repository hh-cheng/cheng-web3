import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/rpc': {
        changeOrigin: true,
        target: 'http://localhost:26657',
        rewrite: (path) => path.replace(/^\/rpc/, ''),
      },
    },
  },
})
