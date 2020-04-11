const puppeteer = require('puppeteer')
const request = require('request-promise-native')

const { Nuxt, Builder } = require('nuxt')
const config = require('../fixture/nuxt.config')

const url = (path) => `http://localhost:3000${path}`
const get = (path) => request(url(path))

jest.setTimeout(10000)

describe('module E2E test', () => {
  let nuxt
  const catched = []
  let brotliHeaders
  // let page
  // let browser

  beforeAll(async () => {
    nuxt = new Nuxt(config)

    const createNuxt = async () => {
      await new Builder(nuxt).build()
      await nuxt.listen(3000)
    }

    const createBrowser = async () => {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: process.env.NODE_ENV !== 'development',
        timeout: 0,
      })
      page = await browser.newPage()
    }
    await Promise.all([createNuxt(), createBrowser()])
    page.on('response', (res) => {
      // Assume that at list runtime js should be compressed
      if (res.request().url().endsWith('.js')) {
        catched.push(res.headers())
      }
      // console.log(res.request().url())
      // console.log(res.headers())
    })
    await page.goto(url('/'), { waitUntil: 'networkidle0' })
    brotliHeaders = catched.find((el) => el['content-encoding'] === 'br')
  }, 300000)

  afterAll(async () => {
    await browser.close()
    await nuxt.close()
  })

  test('Should have at list one brotli file', () => {
    expect(brotliHeaders).toBeTruthy()
  })

  test('Should have fixed content-type', async () => {
    // TODO: write test
    expect(brotliHeaders['content-type']).toContain('application/javascript')
  })
})
