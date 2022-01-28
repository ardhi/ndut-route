const path = require('path')

module.exports = async (scope, opts = {}) => {
  let { name, scanDirs, prefix = '', notFoundMsg = 'Page not found', customBuilder } = opts
  const { _, fs, fastGlob, getConfig, getNdutConfig } = scope.ndut.helper
  const { scan } = scope.ndutRoute.helper
  const config = getConfig()
  const decorators = ['main', 'reply', 'request']

  scope.addHook('onRequest', async (request, reply) => {
    if (!request.routerPath) throw scope.Boom.notFound(notFoundMsg)
  })

  const dirPrefix = name ? `/${name}` : ''

  let hookFiles = []
  for (let n of config.nduts) {
    n = getNdutConfig(n)
    scanDirs = _.concat(scanDirs, [
      { dir: `${n.dir}${dirPrefix}/route`, options: { prefix: n.prefix, alias: n.alias } },
    ])
    for (const d of decorators) {
      const file = `${n.dir}${dirPrefix}/decorator/${d}.js`
      if (fs.existsSync(file)) {
        let mod = require(file)
        if (_.isFunction(mod)) mod = mod.call(scope)
        _.forOwn(mod, (v, k) => {
          scope['decorate' + (d === 'main' ? '' : _.upperFirst(d))](k, v)
        })
      }
    }
    hookFiles = _.concat(hookFiles, await fastGlob(`${n.dir}${dirPrefix}/hook/*.js`))
  }
  if (hookFiles.length > 0) {
    for (const f of hookFiles) {
      const method = _.camelCase(path.basename(f, '.js'))
      scope.addHook(method, require(f))
    }
  }
  let routes = []
  for (const s of scanDirs) {
    routes = _.concat(routes, await scan(s.dir, s.options))
  }

  for (const r of routes) {
    let mod = require(r.file)
    if (_.isFunction(mod)) {
      if (mod.length === 0) mod = await mod.call(scope)
      else mod = { handler: mod }
    }
    mod.url = r.url
    mod.ndutAlias = r.alias
    if (!r.method.includes('CUSTOM')) {
      mod.method = r.method
      scope.route(mod)

      scope.log.debug(`* ${_.padEnd('[' + r.method + ']', 8, ' ')} ${_.isEmpty(prefix) ? '' : ('/' + prefix)}${r.url}`)
    } else if (_.isFunction(customBuilder)) {
      await customBuilder(scope, prefix, mod)
    }
  }
}
