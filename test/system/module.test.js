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
    await new Builder(nuxt).build()
    console.log('Built')
    await nuxt.close()
    // We need to restart, otherwise middleware seems to be started before static build.
    // In our case, we scan assets on server start...
    nuxt = new Nuxt(config)
    await nuxt.server.listen(3000, 'localhost')

    const files = await fs.promises.readdir(
      resolve(__dirname, '../../.nuxt/dist/client')
    )
    // console.log(files)
    assets = files.filter((el) => el.endsWith('.js'))
    console.log(assets)
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
    // console.log('headers', res.headers)
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
    // console.log('headers', res.headers)
    expect(res.headers['content-encoding']).toBe('br')
  })

  test('Should have fixed content-type', async () => {
    const res = await get('/_nuxt/' + assets[0], {
      headers: {
        'accept-encoding': 'br',
      },
    })
    // console.log('headers', res.headers)
    expect(res.headers['content-type']).toContain('application/javascript')
  })

  test('Should not damage request to page', async () => {
    const res = await get('/')
    expect(res.status).toBe(200)
  })

  test('Should return answer even with no headers', async () => {
    const res = await get('/_nuxt/' + assets[0])
    // console.log('headers', res.headers)
    expect(res.status).toBe(200)
  })
})
