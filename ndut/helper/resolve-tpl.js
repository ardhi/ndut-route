const path = require('path')

module.exports = function (name) {
  const { _, fs, getConfig, getNdutConfig } = this.ndut.helper
  let [ ns, file ] = name.split(':')
  if (_.isEmpty(file)) {
    file = ns
    ns = 'app'
  }
  const config = getConfig()
  const cfg = getNdutConfig(ns)
  if (!cfg) throw new Error(`Unknwon namespace '${ns}'`)
  if (file[0] === '.') throw new Error('Relative path is unsupported')
  let ext = path.extname(file)
  if (_.isEmpty(ext)) ext = '.html'
  let newFile = `${cfg.dir}/ndutRoute/template/${_.trimStart(file, '/')}${ext}`
  const override = `${config.dir.base}/ndutRoute/template/override/${ns}/${_.trimStart(file, '/')}${ext}`
  if (fs.existsSync(override)) newFile = override
  return newFile
}
