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
      await mod.call(scope, name, notFoundMsg, cfg)
    }
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
    const hooks = {}
    for (const f of hookFiles) {
      const method = _.camelCase(path.basename(f, '.js'))
      let mod = require(f)
      if (_.isFunction(mod)) {
        if (mod.length === 3) mod = await mod.call(scope, name, notFoundMsg, {})
        else mod = { level: 99, handler: mod }
      }
      if (!mod || !mod.handler) continue
      if (!mod.level) mod.level = 99
      if (!mod.name) {
        let name
        for (const n of config.nduts) {
          const cfg = getNdutConfig(n)
          if (f.startsWith(cfg.dir)) {
            name = cfg.alias
            continue
          }
        }
        mod.name = name
      }
      if (!hooks[method]) hooks[method] = []
      hooks[method].push(mod)
    }
    (hooks || {}).onRequest.push({
      level: 30,
      name: 'notFound',
      handler: async function (request, reply) {
        if (!request.routerPath) throw scope.Boom.notFound(notFoundMsg)
      }
    })
    _.forOwn(hooks, (v, k) => {
      v = _.orderBy(v, ['level'], ['asc'])
      for (const item of v) {
        scope.addHook(k, item.handler)
      }
    })
  }
}
