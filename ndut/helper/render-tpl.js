const path = require('path')

module.exports = function (name, from = 'ndutRoute') {
  const { fs } = this.ndut.helper
  const { resolveTpl } = this.ndutRoute.helper
  const file = resolveTpl(name, from)
  const source = fs.readFileSync(file, 'utf-8' )
  return { source, file }
}
