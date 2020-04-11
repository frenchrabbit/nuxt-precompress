const resolve = require('path').resolve

const optionConfig = {}

module.exports = {
  rootDir: resolve(__dirname, '../..'),
  srcDir: __dirname,
  modules: ['~/../../lib/module'],
  nuxtPrecompress: optionConfig,
  dev: process.env.NODE_ENV !== 'test' && process.env.NODE_ENV === 'production',
}
