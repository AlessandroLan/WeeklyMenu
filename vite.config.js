import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves a project site from /<repo-name>/, so the app needs to
  // know that prefix when it builds its asset URLs. Change this to match your
  // repository name exactly (case-sensitive), e.g. "/menu-settimanale/".
  // If you deploy to a custom domain or to a user/organization page instead
  // (a repo named "<username>.github.io"), set this back to "/".
  base: "/menu-settimanale/",
})
