const build = require('./helper/build')
const handleMisc = require('../lib/handle-misc')

module.exports = async function (scope, options) {
  const { _, fs, getConfig, getNdutConfig } = scope.ndut.helper
  const config = getConfig()
  if (config.httpServer.disabled) {
    scope.log.warn('HTTP server is disabled, route generation canceled')
    return
  }
  let scanDirs = []
  let routes = []
  scanDirs = _.concat(scanDirs, options.scan || [])
  await iterateNduts(async function (cfg) {
    try {
      const result = await aneka.requireBase(`${cfg.dir}/ndutRoute/route.js`, this)
      routes = _.concat(routes, result)
    } catch (err) {}
  })
  await build(scope, { name: 'ndutRoute', scanDirs, routes, prefix: options.prefix })
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
