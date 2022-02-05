const path = require('path')

module.exports = async (scope, opts = {}) => {
  let { name, scanDirs, prefix = '', notFoundMsg = 'pageNotFound', customBuilder } = opts
  const { _, getConfig, getNdutConfig } = scope.ndut.helper
  const { scan, prepInterception } = scope.ndutRoute.helper
  await prepInterception(scope, name, notFoundMsg)
  const config = getConfig()
  const dirPrefix = name ? `/${name}` : ''
  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    scanDirs = _.concat(scanDirs, [
      { dir: `${cfg.dir}${dirPrefix}/route`, options: { prefix: cfg.prefix, alias: cfg.alias } },
    ])
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
    if (scope.ndutI18N) {
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
