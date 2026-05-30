#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { tracks } from '../src/data/tracks.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')
const outputDir = path.join(rootDir, 'public', 'assets', 'generated-previews')
const generatedPreviewsFile = path.join(rootDir, 'src', 'data', 'generatedPreviews.js')

const args = process.argv.slice(2)
const getArg = (name) => {
  const index = args.indexOf(name)
  return index === -1 ? '' : args[index + 1] || ''
}

const hasFlag = (name) => args.includes(name)

const singleId = getArg('--id')
const singleUrl = getArg('--url')
const force = hasFlag('--force')
const width = Number(getArg('--width')) || 900
const height = Number(getArg('--height')) || 680
const quality = Number(getArg('--quality')) || 76
const waitMs = Number(getArg('--wait')) || 6500
const navTimeoutMs = Number(getArg('--nav-timeout')) || 70000
const cropArg = getArg('--crop') || 'mapy-box'
const routePadding = Number(getArg('--route-padding')) || 130
const minMapLeft = Number(getArg('--min-map-left')) || 170
const minMapTop = Number(getArg('--min-map-top')) || 120

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

const normalizeMapyUrl = (url) => {
  if (!url) {
    return ''
  }

  const parsed = new URL(url)
  parsed.searchParams.delete('source')
  return parsed.toString()
}

const buildJobs = () => {
  if (singleId && singleUrl) {
    return [{ id: singleId, name: singleId, mapUrl: singleUrl }]
  }

  return tracks.filter(track => track.id && track.mapUrl)
}

const prepareMapForScreenshot = async (page) => {
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

  await page.evaluate(() => {
    const blockedText = [
      'Open in app',
      'Switch map',
      'Aerial',
      '3D view',
      'Premium',
      'Search',
      'Route',
      'Save',
      'Close',
      'Log in',
      'English',
      'cookies'
    ]

    for (const element of document.querySelectorAll('body *')) {
      const text = element.textContent || ''
      const rect = element.getBoundingClientRect()
      const isOverlaySized = rect.width < window.innerWidth * 0.5 && rect.height < window.innerHeight * 0.5
      const hasBlockedText = blockedText.some(value => text.includes(value))

      if (hasBlockedText && isOverlaySized) {
        element.remove()
      }
    }
  }).catch(() => {})
}

const getManualCrop = (metadata) => {
  if (cropArg === 'mapy-box') {
    const imageWidth = metadata.width || 1440
    const imageHeight = metadata.height || 840
    const left = Math.floor(imageWidth * 0.135)
    const top = Math.floor(imageHeight * 0.12)
    const right = Math.floor(imageWidth * 0.69)
    const bottom = Math.floor(imageHeight * 0.86)

    return {
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    }
  }

  const crop = cropArg
    .split(',')
    .map(value => Number(value.trim()))

  const [cropLeft, cropTop, cropWidth, cropHeight] = crop
  const safeCrop = {
    left: Math.max(0, Math.min(cropLeft, (metadata.width || cropWidth) - 1)),
    top: Math.max(0, Math.min(cropTop, (metadata.height || cropHeight) - 1)),
    width: cropWidth,
    height: cropHeight
  }
  safeCrop.width = Math.min(safeCrop.width, (metadata.width || safeCrop.width) - safeCrop.left)
  safeCrop.height = Math.min(safeCrop.height, (metadata.height || safeCrop.height) - safeCrop.top)

  return safeCrop
}

const expandCropToAspect = (crop, bounds) => {
  const targetAspect = width / height
  let { left, top, width: cropWidth, height: cropHeight } = crop
  const currentAspect = cropWidth / cropHeight

  if (currentAspect > targetAspect) {
    const nextHeight = cropWidth / targetAspect
    top -= (nextHeight - cropHeight) / 2
    cropHeight = nextHeight
  } else {
    const nextWidth = cropHeight * targetAspect
    left -= (nextWidth - cropWidth) / 2
    cropWidth = nextWidth
  }

  left = Math.max(bounds.left, Math.floor(left))
  top = Math.max(bounds.top, Math.floor(top))

  if (left + cropWidth > bounds.right) {
    left = Math.max(bounds.left, Math.floor(bounds.right - cropWidth))
  }

  if (top + cropHeight > bounds.bottom) {
    top = Math.max(bounds.top, Math.floor(bounds.bottom - cropHeight))
  }

  cropWidth = Math.min(Math.ceil(cropWidth), bounds.right - left)
  cropHeight = Math.min(Math.ceil(cropHeight), bounds.bottom - top)

  return {
    left,
    top,
    width: Math.max(1, cropWidth),
    height: Math.max(1, cropHeight)
  }
}

const getRouteCrop = async (screenshot, metadata) => {
  if (cropArg !== 'auto') {
    return getManualCrop(metadata)
  }

  const imageWidth = metadata.width || 1440
  const imageHeight = metadata.height || 840
  const cropBounds = {
    left: minMapLeft,
    top: minMapTop,
    right: Math.floor(imageWidth * 0.72),
    bottom: Math.floor(imageHeight * 0.82)
  }
  const { data } = await sharp(screenshot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let minX = imageWidth
  let minY = imageHeight
  let maxX = 0
  let maxY = 0
  let routePixels = 0

  for (let y = cropBounds.top; y < cropBounds.bottom; y += 1) {
    for (let x = cropBounds.left; x < cropBounds.right; x += 1) {
      const index = (y * imageWidth + x) * 3
      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]

      const looksLikeRoute = red > 185 && green < 105 && blue < 105 && red - green > 80 && red - blue > 80
      if (!looksLikeRoute) {
        continue
      }

      routePixels += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (routePixels < 80) {
    console.warn('route pixels not found, using fallback map crop')
    return getManualCrop({ width: imageWidth, height: imageHeight })
  }

  const left = Math.max(cropBounds.left, minX - routePadding)
  const top = Math.max(cropBounds.top, minY - routePadding)
  const right = Math.min(cropBounds.right, maxX + routePadding)
  const bottom = Math.min(cropBounds.bottom, maxY + routePadding)

  return expandCropToAspect({
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  }, cropBounds)
}

const capturePreview = async (browser, job) => {
  const outputPath = path.join(outputDir, `${job.id}.webp`)
  if (!force && await fileExists(outputPath)) {
    console.log(`skip ${job.id} - preview already exists`)
    return
  }

  const page = await browser.newPage({
    viewport: { width: 1440, height: 840 },
    deviceScaleFactor: 1
  })

  try {
    console.log(`open ${job.name}`)
    await page.goto(normalizeMapyUrl(job.mapUrl), {
      waitUntil: 'domcontentloaded',
      timeout: navTimeoutMs
    })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(waitMs)
    await prepareMapForScreenshot(page)

    const rawScreenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      animations: 'disabled',
      timeout: 65000
    })

    const metadata = await sharp(rawScreenshot).metadata()
    const safeCrop = await getRouteCrop(rawScreenshot, metadata)

    await sharp(rawScreenshot)
      .extract(safeCrop)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toFile(outputPath)

    console.log(`saved ${path.relative(rootDir, outputPath)}`)
  } finally {
    await page.close()
  }
}

const writeGeneratedPreviewIndex = async () => {
  await fs.mkdir(outputDir, { recursive: true })
  const files = await fs.readdir(outputDir).catch(() => [])
  const entries = files
    .filter(file => file.endsWith('.webp'))
    .map(file => {
      const id = path.basename(file, '.webp')
      return `  ${JSON.stringify(id)}: ${JSON.stringify(`/assets/generated-previews/${file}`)}`
    })
    .sort()

  const contents = `export const generatedPreviewImages = {\n${entries.join(',\n')}\n}\n`
  await fs.writeFile(generatedPreviewsFile, contents)
}

const main = async () => {
  const jobs = buildJobs()
  const failures = []

  if (!jobs.length) {
    console.log('No Mapy preview jobs found.')
    return
  }

  await fs.mkdir(outputDir, { recursive: true })

  const executablePath = await findBrowserExecutable()
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {})
  })

  try {
    for (const job of jobs) {
      try {
        await capturePreview(browser, job)
      } catch (error) {
        failures.push({ id: job.id, message: error.message || String(error) })
        console.warn(`failed ${job.id}: ${error.message || error}`)
      }
    }
  } finally {
    await browser.close()
  }

  await writeGeneratedPreviewIndex()
  console.log(`updated ${path.relative(rootDir, generatedPreviewsFile)}`)

  if (failures.length) {
    console.warn(`finished with ${failures.length} failed preview(s):`)
    failures.forEach(failure => console.warn(`- ${failure.id}: ${failure.message}`))
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
