import { build } from 'esbuild'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const buildOptions = {
  entryPoints: [resolve(__dirname, 'src/server.ts')],
  bundle: true,
  platform: 'node',
  outfile: resolve(__dirname, 'dist/server.js'),
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  target: ['node18'],
  external: ['./node_modules/*'],
  plugins: [],
}

build(buildOptions)
  .then(() => console.log('⚡ Build complete!'))
  .catch((err) => {
    console.error('❌ Build failed:', err)
    process.exit(1)
  })
