module.exports = function (path, ndut = 'app', params = {}) {
  const { _, getNdutConfig } = this.ndut.helper
  const config = getNdutConfig(ndut)
  const routeCfg = getNdutConfig('ndut-route')
  let newPath = `${routeCfg.prefix}${config ? ('/' + config.prefix) : ''}/${_.trim(path, '/')}`
  _.forOwn(params, (v, k) => {
    newPath = newPath.replaceAll(`:${k}`, v)
  })
  return newPath
}
