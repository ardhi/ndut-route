const build = require('./helper/build')
const handleMisc = require('../lib/handle-misc')

module.exports = async function (scope, options) {
  const { _, fs, getConfig, iterateNduts } = scope.ndut.helper
  const config = getConfig()
  if (config.httpServer.disabled) {
    scope.log.warn('HTTP server is disabled, route generation canceled')
    return
  }
  let scanDirs = []
  let routes = []
  if (!(this.ndutView || _.get(options, 'disable.purecssWithView'))) {
    routes.push({
      url: '/purecss/:name',
      method: 'GET',
      handler: async (request, reply) => {
        const purecss = require('purecss')
        let content = ''
        try {
          content = purecss.getFile(request.params.name)
        } catch (err) {}
        reply.send(content)
      }
    })
  }

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
  await iterateNduts(async function(cfg) {
    const file = `${cfg.dir}/ndutRoute/child-plugin.js`
    if (fs.existsSync(file)) {
      if (cfg.disablePlugin) scope.log.warn(`Plugin '${cfg.instanceName}' is disabled`)
      else {
        scope.log.info(`Register '${cfg.instanceName}'`)
        const mod = require(file)
        await scope.register(mod, cfg)
      }
    }
  })
}
