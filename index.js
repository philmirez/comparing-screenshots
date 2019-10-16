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

  await page.setViewport({
    height: options.height,
    width: options.width
  })
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
    const height = 900
    const width = 640
    const diff = new PNG({width, height})
    const stagingOptions = {
      path: 'stagingScreenshot.png',
      url: 'https://www.google.com/search?q=cat',
      height,
      width
    }
    const prodOptions = {
      path: 'prodScreenshot.png',
      url: 'https://www.google.com/search?q=cat',
      height,
      width
    }
    const [stagingScreenshot, prodScreenshot] = await takeScreenshots(stagingOptions, prodOptions)
    const allocationSize = height * width * 4
    const stagingBuff = Buffer.alloc(allocationSize)
    const prodBuff = Buffer.alloc(allocationSize)
    stagingBuff.fill(stagingScreenshot.data)
    prodBuff.fill(prodScreenshot.data)

    const numDiffPixels = pixelmatch(stagingBuff, prodBuff, diff.data, width, height, { threshold: 0.1 })
    fs.writeFileSync('diff.png', PNG.sync.write(diff))
    console.log('Results', JSON.stringify({
      diffScore: numDiffPixels / (height * width)
    }))
  } catch (error) {
    console.error(error)
  }
}

run()