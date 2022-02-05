const path = require('path')

module.exports = async function (scope, name, notFoundMsg) {
  const { _, fs, getConfig, getNdutConfig, fastGlob } = scope.ndut.helper
  const config = getConfig()
  const decorators = ['main', 'reply', 'request']

  const dirPrefix = name ? `/${name}` : ''
  let hookFiles = []
  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const interceptor = `${cfg.dir}${dirPrefix}/interceptor.js`
    if (fs.existsSync(interceptor)) {
      const mod = require(interceptor)
      await mod.call(scope, cfg)
    }
  }
  scope.addHook('onRequest', async (request, reply) => {
    if (!request.routerPath) throw scope.Boom.notFound(notFoundMsg)
  })
  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    for (const d of decorators) {
      const file = `${cfg.dir}${dirPrefix}/decorator/${d}.js`
      if (fs.existsSync(file)) {
        let mod = require(file)
        if (_.isFunction(mod)) mod = mod.call(scope)
        _.forOwn(mod, (v, k) => {
          scope['decorate' + (d === 'main' ? '' : _.upperFirst(d))](k, v)
        })
      }
    }
    hookFiles = _.concat(hookFiles, await fastGlob(`${cfg.dir}${dirPrefix}/hook/*.js`))
  }
  if (hookFiles.length > 0) {
    for (const f of hookFiles) {
      const method = _.camelCase(path.basename(f, '.js'))
      scope.addHook(method, require(f))
    }
  }
}