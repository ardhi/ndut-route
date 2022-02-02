module.exports = function (name) {
  const { fs } = this.ndut.helper
  const { resolveTpl } = this.ndutRoute.helper
  const file = resolveTpl(name)
  const source = fs.readFileSync(file, 'utf-8' )
  return { source, file }
}
