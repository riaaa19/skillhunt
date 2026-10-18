import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Backend comes later: /api calls are proxied to Express on :4000
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:4000' } } })
