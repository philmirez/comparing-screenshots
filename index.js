const puppeteer = require('puppeteer')
const pixelmatch = require('pixelmatch')
const PNG = require('pngjs').PNG

async function takeScreenshot(options) {
  const browser = await puppeteer.launch({
    defaultViewport: null
  });

  const page = await browser.newPage()
  await page.setViewport({
    height: 960,
    width: 640
  })
  await page.goto(
    options.url,
    { waitUntil: 'networkidle2' }
  )
  const bodyHandle = await page.$('body');
  const { width, height } = await bodyHandle.boundingBox();
  const screenshot = await page.screenshot({
    path: options.path || null,
    clip: {
      x: 0,
      y: 0,
      width: Math.round(width),
      height: Math.round(height)
    },
    type: 'png'
  });

  await bodyHandle.dispose();
  await browser.close();

  return {
    data: screenshot,
    width: Math.round(width),
    height: Math.round(height)
  };
}

const run = async function () {
  try {
    const options1 = {
      path: 'screenshot1.png',
      url: 'https://www.healthcentral.com'
    }
    const options2 = {
      path: 'screenshot2.png',
      url: 'https://www.healthcentral.com'
    }


    const [screenshot1, screenshot2] = await Promise.all([takeScreenshot(options1), takeScreenshot(options2)])
    console.log('screenshot1', screenshot1)
    console.log('screenshot1 length', screenshot1.data.length)
    console.log('screenshot2', screenshot2)
    console.log('screenshot2 length', screenshot2.data.length)

    const maxHeight = Math.max(screenshot1.height, screenshot2.height)
    const maxWidth = Math.max(screenshot1.width, screenshot2.width)
    console.log('maxHeight', maxHeight)
    console.log('maxWidth', maxWidth)
    const totalPixels = maxHeight * maxWidth
    const diff = new PNG({ width: maxWidth, height: maxHeight })

    const allocationSize = Math.max(screenshot1.data.length, screenshot2.data.length, diff.data.length)
    const buff1 = Buffer.alloc(allocationSize)
    const buff2 = Buffer.alloc(allocationSize)
    const buffDiff = Buffer.alloc(allocationSize)
    buff1.fill(screenshot1.data)
    buff2.fill(screenshot2.data)
    console.log('buff1 length', buff1.length)
    console.log('buff2 length', buff2.length)


    console.log('diff.data length', diff.data.length)
    const numDiffPixels = pixelmatch(buff1, buff2, buffDiff, maxWidth, maxHeight, { threshold: 0.2 })
    console.log('numDiffPixels', numDiffPixels)
    console.log('Results', JSON.stringify({
      diffScore: numDiffPixels / totalPixels
    }))
  } catch (error) {
    console.error(error)
  }
}

run()