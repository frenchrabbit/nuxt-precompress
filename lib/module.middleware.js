import fs from 'fs'
import serveStatic from 'serve-static'
const mime = serveStatic.mime
export const createMiddleware = (path, options) => {
  // Checks if requested file exists with
  // orderPreference extensions
  const { encodingsPriority = ['br', 'gzip'] } = options
  const extensions = {
    br: 'br',
    gzip: 'gz',
  }
  const resolvedFiles = {}
  // build encodings dictionary on middleware creation
  resolveCompressed(path)

  return (req, res, next) => {
    if (!req.headers['accept-encoding']) {
      return next()
    }

    const encodings = req.headers['accept-encoding']
      .split(',')
      .map((el) => el.trim())

    const url = req.url.split('?').splice(0, 1).join()
    const query = req.url.split('?').splice(1).join('?')

    // console.log(req)

    const file = resolvedFiles[decodeURIComponent(url)]

    if (file) {
      const bestEncoding = encodingsPriority.find(
        (el) => encodings.includes(el) && file.includes(el)
      )

      if (bestEncoding) {
        var type = mime.lookup(url)
        var charset = mime.charsets.lookup(type)

        req.url =
          url + '.' + extensions[bestEncoding] + (query ? '?' + query : '')

        res.setHeader('Vary', 'Accept-Encoding')
        res.setHeader('Content-Encoding', bestEncoding)
        res.setHeader(
          'Content-Type',
          type + (charset ? '; charset=' + charset : '')
        )
      }
    }
    next(null, req, res)
  }

  function resolveCompressed(directoryPath) {
    if (!fs.existsSync(directoryPath)) return
    var files = fs.readdirSync(directoryPath)
    for (var i = 0; i < files.length; i++) {
      var filePath = directoryPath + '/' + files[i]
      var stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        resolveCompressed(filePath)
      } else {
        const relativePath = filePath.replace(path, '')

        const resolvedEncoding = encodingsPriority.find(
          (enc) => extensions[enc] && relativePath.endsWith(extensions[enc])
        )
        if (resolvedEncoding) {
          const relativeNoExt = relativePath.split('.').slice(0, -1).join('.')
          resolvedFiles[relativeNoExt] = resolvedFiles[relativeNoExt] || []
          resolvedFiles[relativeNoExt].push(resolvedEncoding)
        }
      }
    }
  }
}
