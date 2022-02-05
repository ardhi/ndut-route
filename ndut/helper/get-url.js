module.exports = function (path, ndut = false, params = {}) {
  const { _, getNdutConfig } = this.ndut.helper
  const config = ndut ? getNdutConfig(ndut) : null
  const ndutPrefix = ndut ? (ndut === 'app' ? '' : ('/' + config.prefix)) : ''
  const routeCfg = getNdutConfig('ndut-route')
  let newPath = `${routeCfg.prefix}${ndutPrefix}/${_.trim(path, '/')}`
  console.log(newPath)
  _.forOwn(params, (v, k) => {
    const re = new RegExp(`:${k}`, 'g')
    newPath = newPath.replace(re, v)
  })
  return newPath
}
