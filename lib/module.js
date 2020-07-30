import { createMiddleware } from './module.middleware'
import consola from 'consola'
// import plugin from './module.plugin'
import path from 'path'
import CompressionPlugin from 'compression-webpack-plugin'

export default function (moduleOptions) {
  const userOptions = this.options.nuxtPrecompress || moduleOptions
  const options = {
    enabled: true, // Enable in production
    report: false,
    test: /\.(js|css|html|txt|xml|svg)$/,
    ...userOptions,
    middleware: {
      enabled: true,
      enabledStatic: true,
      encodingsPriority: ['br', 'gzip'],
    },
    gzip: {
      enabled: true,
      filename: '[path].gz[query]',
      compressionOptions: { level: 9 },
      threshold: 1024,
      minRatio: 0.8,
      ...userOptions.gzip,
    },
    brotli: {
      enabled: true,
      filename: '[path].br[query]',
      compressionOptions: { level: 11 },
      threshold: 1024,
      minRatio: 0.8,
      ...userOptions.brotli,
    },
  }

  const { enabled, report } = options

  if (enabled === false) {
    if (report) {
      consola.info('Skip activation of nuxt-precompress module')
    }
    return false
  }

  // compress on build
  this.extendBuild((config, { isDev, isServer }) => {
    if (isDev || isServer) {
      return
    }
    if (options.gzip.enabled) {
      const gzipOptions = { ...options.gzip }
      delete gzipOptions.enabled
      config.plugins.push(
        new CompressionPlugin({
          test: options.test,
          ...gzipOptions,
          algorithm: 'gzip',
        })
      )
    }

    if (options.brotli.enabled) {
      const brotliOptions = { ...options.brotli }
      delete brotliOptions.enabled
      config.plugins.push(
        new CompressionPlugin({
          test: options.test,
          ...brotliOptions,
          algorithm: 'brotliCompress',
        })
      )
    }
  })

  if (options.middleware.enabled) {
    this.nuxt.hook('render:setupMiddleware', (app) => {
      if (report) {
        consola.info('Add nuxt-precompress module to server middleware')
      }

      // same approach as in
      // https://github.com/nuxt/nuxt.js/blob/c02ded2d8622c290ba28c696d363426b825a0977/packages/server/src/server.js#L93
      if (options.middleware.enabledStatic) {
        const staticMiddleware = createMiddleware(
          path.resolve(this.options.srcDir, this.options.dir.static),
          {
            ...options.middleware,
          }
        )
        staticMiddleware.prefix = this.options.render.static.prefix
        this.nuxt.server.useMiddleware(staticMiddleware)
      }
      // Serve .nuxt/dist/client files only for production
      // For dev they will be served with devMiddleware

      const distDir = path.resolve(this.options.buildDir, 'dist', 'client')
      this.nuxt.server.useMiddleware({
        path: this.nuxt.server.publicPath,
        handler: createMiddleware(distDir, {
          ...options.middleware,
          prefix: this.nuxt.server.publicPath,
        }),
      })
    })
  }

  return true
}
