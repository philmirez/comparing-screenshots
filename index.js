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
      url: 'https://www.google.com/search?q=cat'
    }
    const prodOptions = {
      path: 'prodScreenshot.png',
      url: 'https://www.google.com/search?q=cat'
    }
    const [stagingScreenshot, prodScreenshot] = await takeScreenshots(stagingOptions, prodOptions)
    const prodPng = PNG.sync.read(prodScreenshot.data)
    const stgPng = PNG.sync.read(stagingScreenshot.data)
    const diff = new PNG({width: prodPng.width, height: prodPng.height})
    const numDiffPixels = pixelmatch(prodPng.data, stgPng.data, diff.data, prodPng.width, prodPng.height, { threshold: 0.1 })

    fs.writeFileSync('diff.png', PNG.sync.write(diff))

    console.log('Results', JSON.stringify({
      diffScore: numDiffPixels / (prodPng.height * prodPng.width)
    }))
  } catch (error) {
    console.error(error)
  }
}

run()