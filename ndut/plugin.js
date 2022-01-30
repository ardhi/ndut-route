const build = require('./helper/build')
const handleMisc = require('../lib/handle-misc')

module.exports = async function (scope, options) {
  const { _, fs, getConfig, getNdutConfig } = scope.ndut.helper
  const config = getConfig()
  let scanDirs = []
  scanDirs = _.concat(scanDirs, options.scan || [])
  await build(scope, { name: 'ndutRoute', scanDirs, prefix: options.prefix })
  await handleMisc.call(scope)
  // scope.ndutRoute.ctx = scope
  // TODO: replace these hacks with cleaner cascade register
  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const file = `${cfg.dir}/ndutRoute/child-plugin.js`
    if (!fs.existsSync(file)) continue
    if (cfg.disablePlugin) {
      scope.log.warn(`Plugin '${cfg.instanceName}' is disabled`)
      continue
    }
    scope.log.info(`Register '${cfg.instanceName}'`)
    const mod = require(file)
    await scope.register(mod, cfg)
  }
}
