import axios from 'axios'
import fs from 'fs'
import { resolve } from 'path'

import { Nuxt, Builder } from 'nuxt'
import config from '../fixture/nuxt.config'

const url = (path) => `http://localhost:3000${path}`
const get = (path, config) => axios.get(url(path), config)

jest.setTimeout(10000)

describe('module E2E test', () => {
  let nuxt
  let assets = []
  let brotli = []
  let gzip = []

  beforeAll(async () => {
    nuxt = new Nuxt(config)
    const builder = new Builder(nuxt)
    await builder.build()
    // // We will need restart nuxt to make sure all build artifacts are done
    // await nuxt.close()
    // nuxt = new Nuxt(config)
    await nuxt.ready()
    await nuxt.listen(3000)

    const files = await fs.promises.readdir(
      resolve(__dirname, '../../.nuxt/dist/client')
    )
    console.log(files)
    assets = files.filter((el) => el.endsWith('.js'))
    brotli = files.filter((el) => el.endsWith('.br'))
    gzip = files.filter((el) => el.endsWith('.gz'))

    // nuxt = new Nuxt(config)
  }, 300000)

  afterAll(async () => {
    // await browser.close()
    await nuxt.close()
  })

  test('Should have at list one gzip file', () => {
    expect(gzip.length).toBeTruthy()
  })

  test('Should have at list one brotli file', () => {
    expect(brotli.length).toBeTruthy()
  })

  test('Should return brotli if accepted', async () => {
    const res = await get('/_nuxt/' + assets[0], {
      headers: {
        'accept-encoding': 'br',
      },
    })
    expect(res.headers['content-encoding']).toBe('br')
  })

  // Axios seems to loose content encoding header if it is gzip

  // test('Should return gzip if accepted', async () => {
  //   const res = await get('/_nuxt/' + assets[0], {
  //     headers: {
  //       'accept-encoding': 'gzip',
  //     },
  //   })
  //   console.log(res.headers)
  //   expect(res.headers['content-encoding']).toBe('gzip')
  // })

  test('Should return br if accepted gzip, br', async () => {
    const res = await get('/_nuxt/' + assets[0], {
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
    })
    expect(res.headers['content-encoding']).toBe('br')
  })

  test('Should have fixed content-type', async () => {
    const res = await get('/_nuxt/' + assets[0], {
      headers: {
        'accept-encoding': 'br',
      },
    })
    expect(res.headers['content-type']).toContain('application/javascript')
  })

  test('Should not damage request to page', async () => {
    const res = await get('/')
    expect(res.status).toBe(200)
  })

  test('Should return answer even with no headers', async () => {
    const res = await get('/_nuxt/' + assets[0])
    expect(res.status).toBe(200)
  })
})
