const build = require('./helper/build')

module.exports = async function (scope, options) {
  const { _ } = scope.ndut.helper

  let scanDirs = []
  scanDirs = _.concat(scanDirs, options.scan || [])
  await build(scope, { name: 'ndutRoute', scanDirs, prefix: options.prefix })
}
