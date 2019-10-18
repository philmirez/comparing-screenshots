const puppeteer = require('puppeteer')
const pixelmatch = require('pixelmatch')
const PNG = require('pngjs').PNG
const fs = require('fs')

function getTime(startTime) {
  return Date.now() - startTime
}

async function takeScreenshot(page, options) {
  const startTime = Date.now()
  await page.goto(
    options.url,
    {
      waitUntil: 'networkidle2'
    }
  )
  const totalTime = getTime(startTime)
  const data = await page.screenshot({
    path: options.path || null,
    fullPage: true
  })

  return {
    data: data,
    time: totalTime
  }
}

async function takeScreenshots(stagingOptions, prodOptions) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const staging = await takeScreenshot(page, stagingOptions)
  const prod = await takeScreenshot(page, prodOptions)

  await browser.close();

  return [
    staging,
    prod
  ]
}

const run = async function () {
  try {
    const stagingOptions = {
      path: 'stagingScreenshot.png',
      url: 'https://www.bing.com/search?q=cat'
    }
    const prodOptions = {
      path: 'prodScreenshot.png',
      url: 'https://www.google.com/search?q=cat'
    }
    const [stagingScreenshot, prodScreenshot] = await takeScreenshots(stagingOptions, prodOptions)
    const prodPng = PNG.sync.read(prodScreenshot.data)
    const stgPng = PNG.sync.read(stagingScreenshot.data)
    const maxWidth = Math.max(stgPng.width, prodPng.width)
    const maxHeight = Math.max(stgPng.height, prodPng.height)
    const stgBuffer = Buffer.alloc(maxHeight * maxWidth * 4)
    const prodBuffer = Buffer.alloc(maxHeight * maxWidth * 4)
    stgBuffer.fill(stgPng.data)
    prodBuffer.fill(prodPng.data)
    const diff = new PNG({width: maxWidth, height: maxHeight})
    const numDiffPixels = pixelmatch(prodBuffer, stgBuffer, diff.data, maxWidth, maxHeight, { threshold: 0.1 })

    fs.writeFileSync('diff.png', PNG.sync.write(diff))

    console.log('Results', JSON.stringify({
      diffScore: numDiffPixels / (maxHeight * maxWidth)
    }))
  } catch (error) {
    console.error(error)
  }
}

run()