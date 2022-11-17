const path = require('path')

module.exports = async function (scope, { name, scanDirs = [], prefix = '', notFoundMsg = 'pageNotFound', customBuilder, routes = [], noInterception, noScan }) {
  const { _, getConfig, getNdutConfig, outmatch } = scope.ndut.helper
  const routeOpts = getNdutConfig(name)
  const { scan, prepInterception } = scope.ndutRoute.helper
  const restCfg = getNdutConfig('ndut-rest')
  const routeCfg = getNdutConfig('ndut-route')
  const config = getConfig()
  if (!noInterception) await prepInterception(scope, name, notFoundMsg)
  const dirPrefix = name ? `/${name}` : ''
  if (!noScan) {
    for (const n of config.nduts) {
      const cfg = getNdutConfig(n)
      scanDirs = _.concat(scanDirs, [
        { dir: `${cfg.dir}${dirPrefix}/route`, options: { prefix: cfg.prefix, alias: cfg.alias } },
      ])
    }
    for (const s of scanDirs) {
      routes = _.concat(routes, await scan(s.dir, s.options))
    }
  }

  let disabledRoutes = []

  for (const r of routes) {
    if (name === 'ndutRoute' && r.url === routeCfg.home) r.url = '/'
    let mod = r.file ? require(r.file) : _.cloneDeep(r)
    if (_.isFunction(mod)) {
      if (mod.length === 0) mod = await mod.call(scope)
      else mod = { handler: mod }
    }
    if (mod.schema) {
      _.each(r.method, m => {
        if (_.get((restCfg || {}), `hideSwaggerTags.${r.url}`, []).includes(m)) mod.schema.tags = false
      })
    }
    mod.dependency = mod.dependency || []
    if (_.isString(mod.dependency)) mod.dependency = [mod.dependency]
    if (mod.dependency.length > 0) {
      const intersect = _.intersection(config.nduts, mod.dependency)
      if (intersect.length !== mod.dependency.length) {
        disabledRoutes.push(r.url)
        continue
      }
    }
    let disabled = _.get(routeOpts, 'disable.routes')
    if (disabled) {
      let match = false
      if (disabled === true) disabled = ['**/*']
      if (_.isString(disabled)) disabled = [disabled]
      _.each(disabled, d => {
        const isMatch = outmatch(d)
        if (isMatch(r.url)) {
          match = true
          return
        }
      })
      if (match) {
        if (!disabledRoutes.includes(r.url)) disabledRoutes.push(r.url)
        continue
      }
    }

    if (scope.ndutI18N && !noInterception) {
      const cfg = getNdutConfig('ndut-i18n')
      if (cfg.lang === 'detect' && cfg.detectFromParams) r.url = '/:lang' + r.url
    }
    mod.url = r.url
    mod.ndutAlias = r.alias

    if (!r.method.includes('CUSTOM')) {
      mod.method = r.method
      mod.config = { config: { name: r.name } }
      scope.route(mod)
      scope.log.debug(`* ${_.padEnd('[' + r.method + ']', 8, ' ')} ${_.isEmpty(prefix) ? '' : ('/' + prefix)}${r.url}`)
    } else if (_.isFunction(customBuilder)) {
      await customBuilder(scope, prefix, mod)
    }
  }
  disabledRoutes = _.uniq(disabledRoutes)
  scope[routeOpts.instanceName].helper.disabledRoutes = disabledRoutes
  if (disabledRoutes.length > 0) {
    _.each(disabledRoutes, d => {
      scope.log.warn(`* All routes to '${d}' is disabled`)
    })
  }
}
