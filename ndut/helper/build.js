const path = require('path')

module.exports = async function (scope, { name, scanDirs = [], prefix = '', notFoundMsg = 'pageNotFound', customBuilder, routes = [], noInterception, noScan }) {
  const { _, getConfig, getNdutConfig } = scope.ndut.helper
  const { scan, prepInterception } = scope.ndutRoute.helper
  const restCfg = getNdutConfig('ndut-rest')
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

  for (const r of routes) {
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
    if (scope.ndutI18N && !noInterception) {
      const cfg = getNdutConfig('ndut-i18n')
      if (cfg.lang === 'detect' && cfg.detectFromParams) r.url = '/:lang' + r.url
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
