const path = require('path')
const verbs = ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'CUSTOM']

module.exports = async function (dir = '', options = {}) {
  const { _, fastGlob } = this.ndut.helper
  if (!options.prefix) options.prefix = '/'
  if (options.prefix[0] !== '/') options.prefix = '/' + options.prefix
  if (_.isEmpty(dir)) throw new Error('Directory to scan is not provided')
  const files = await fastGlob(`${dir}/**/*.js`)
  const result = []
  const paths = {}
  for (const file of files) {
    let url = file
      .replace(dir, '')
      .replace(/@@@/g, '*')
      .replace(/@@/g, '\t')
      .replace(/@/g, ':')
      .replace(/\t/g, '@')
      .split('/')
      .slice(0, -1)
      .join('/')
    url = (options.prefix + url).replace(/\/\//g, '/')
    if (!paths[url]) paths[url] = []
    const method = path.basename(file, '.js').split('-').map(m => m.toUpperCase())
    let valid = true
    _.each(method, m => {
      if (!verbs.includes(m)) valid = false
    })
    if (valid && _.intersection(verbs, method).length > 0) {
      const check = _.intersection(paths[url], method)
      if (check.length > 0) throw this.Boom.internal(`Method '${method.join('-')}' clashed with '${paths[url].join('-')}' in path '${url}'`)
      paths[url] = _.uniq(_.concat(paths[url], method))
      result.push({ prefix: options.prefix, file, url, method, alias: options.alias })
    }
  }
  return result
}
