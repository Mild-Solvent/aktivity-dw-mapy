import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'

const windowsChromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
]

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const findBrowserExecutable = async () => {
  for (const browserPath of windowsChromePaths) {
    if (browserPath && await fileExists(browserPath)) {
      return browserPath
    }
  }

  return ''
}

const readJsonBody = (request) => {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', chunk => {
      body += chunk
    })
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(payload))
}

const cleanId = (id) => {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const normalizeMapyUrl = (url) => {
  const parsed = new URL(url)
  parsed.searchParams.delete('source')
  return parsed.toString()
}

const hideMapyChrome = async (page) => {
  await page.keyboard.press('Escape').catch(() => {})

  const acceptButton = page.getByRole('button', { name: /accept|agree|suhlas|souhlas|povoli/i })
  if (await acceptButton.count().catch(() => 0)) {
    await acceptButton.first().click({ timeout: 1200 }).catch(() => {})
  }

  await page.addStyleTag({
    content: `
      button,
      a[href],
      [role="button"],
      [class*="cookie"],
      [id*="cookie"],
      [class*="consent"],
      [id*="consent"],
      [class*="banner"],
      [class*="modal"],
      [class*="dialog"],
      [class*="popup"],
      [class*="premium"],
      [class*="search"],
      [class*="route"] {
        display: none !important;
      }
    `
  }).catch(() => {})
}

const captureMapyPreview = async ({ id, mapUrl, rootDir }) => {
  const previewId = cleanId(id)
  if (!previewId) {
    throw new Error('Missing trail id.')
  }

  if (!mapUrl || !new URL(mapUrl).hostname.includes('mapy.')) {
    throw new Error('Paste a valid Mapy URL first.')
  }

  const outputDir = path.join(rootDir, 'public', 'assets', 'generated-previews')
  const outputPath = path.join(outputDir, `${previewId}.webp`)
  await fs.mkdir(outputDir, { recursive: true })

  const executablePath = await findBrowserExecutable()
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {})
  })

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 840 },
      deviceScaleFactor: 1
    })

    try {
      await page.goto(normalizeMapyUrl(mapUrl), {
        waitUntil: 'domcontentloaded',
        timeout: 70000
      })
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(3500)
      await hideMapyChrome(page)

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        animations: 'disabled',
        timeout: 65000
      })
      const metadata = await sharp(screenshot).metadata()
      const imageWidth = metadata.width || 1440
      const imageHeight = metadata.height || 840
      const crop = {
        left: Math.floor(imageWidth * 0.135),
        top: Math.floor(imageHeight * 0.12),
        width: Math.floor(imageWidth * 0.555),
        height: Math.floor(imageHeight * 0.74)
      }

      await sharp(screenshot)
        .extract(crop)
        .resize(900, 680, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 76 })
        .toFile(outputPath)
    } finally {
      await page.close()
    }
  } finally {
    await browser.close()
  }

  return `/assets/generated-previews/${previewId}.webp?generated=${Date.now()}`
}

const mapyPreviewPlugin = () => ({
  name: 'mapy-preview-api',
  configureServer(server) {
    server.middlewares.use('/api/mapy-preview', async (request, response, next) => {
      if (request.method !== 'POST') {
        next()
        return
      }

      try {
        const payload = await readJsonBody(request)
        const previewImage = await captureMapyPreview({
          id: payload.id,
          mapUrl: payload.mapUrl,
          rootDir: process.cwd()
        })
        sendJson(response, 200, { previewImage })
      } catch (error) {
        sendJson(response, 500, {
          error: error.message || 'Could not generate Mapy preview.'
        })
      }
    })
  }
})

export default defineConfig({
  plugins: [vue(), mapyPreviewPlugin()],
  server: {
    port: 3000
  },
  // Custom domain - use root base path
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure public assets are copied properly
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: undefined
      }
    }
  },
  // Ensure all public assets including CNAME and manifest are copied
  publicDir: 'public'
})
