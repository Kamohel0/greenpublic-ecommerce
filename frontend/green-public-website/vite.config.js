import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_BASE_URL || "http://localhost:8080"

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  }
})