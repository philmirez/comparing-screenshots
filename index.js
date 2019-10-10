const puppeteer = require('puppeteer')
const pixelmatch = require('pixelmatch')
const PNG = require('pngjs').PNG

async function takeScreenshot(options) {
  const browser = await puppeteer.launch({
    defaultViewport: null
  });

  const page = await browser.newPage();

  page.setViewport({
    height: options.height,
    width: options.width
  })

  await page.goto(
    options.url,
    { waitUntil: 'domcontentloaded' }
  );

  const screenshot = await page.screenshot();

  await browser.close();

  return screenshot;
}

const run = async function () {
  const options = {
    width: 640,
    height: 960,
    url1: 'https://www.google.com',
    url2: 'https://www.bing.com'
  }
  const totalPixels = options.width * options.height

  const screenshot1 = await takeScreenshot({
    width: options.width,
    height: options.height,
    url: options.url1
  })
  console.log('screenshot1', screenshot1)
  console.log('screenshot1 length', screenshot1.length)

  const screenshot2 = await takeScreenshot({
    width: options.width,
    height: options.height,
    url: options.url2
  })
  console.log('screenshot2', screenshot2)
  console.log('screenshot2 length', screenshot2.length)

  const allocationSize = Math.max(screenshot1.length, screenshot2.length)
  const buff1 = Buffer.alloc(allocationSize)
  const buff2 = Buffer.alloc(allocationSize)
  buff1.fill(screenshot1)
  buff2.fill(screenshot2)
  console.log('buff1 length', buff1.length)
  console.log('buff2 length', buff2.length)

  const diff = new PNG({
    width: options.width,
    height: options.height
  })
  const numDiffPixels = pixelmatch(buff1, buff2, diff.data, options.width, options.height, { threshold: 0.2 })
  console.log('Results', JSON.stringify({
    done: true,
    diffScore: numDiffPixels / totalPixels
  }))
}

run()