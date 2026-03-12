import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',  // simulates browser environment
    globals: true  ,
    include: ['../tests/**/*.spec.{js,jsx}']    
  }
})