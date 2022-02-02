const path = require('path')

const inBetween = (str, quote = '"') => {
  const matches = str.split(quote)
  return matches[1]
}

module.exports = function (name, from = 'ndutRoute', theme = 'default') {
  const { fs } = this.ndut.helper
  const { resolveTpl } = this.ndutRoute.helper
  const file = resolveTpl(name, from, theme)
  let source = fs.readFileSync(file, 'utf-8' )
  const sources = source.split('\n')
  for (const i in sources) {
    const s = sources[i]
    if (!s.includes('{% extends')) continue
    let link = inBetween(s)
    if (!link) link = inBetween(s, "'")
    if (!link) continue
    sources[i] = s.replace(link, link + ':' + theme)
  }
  source = sources.join('\n')
  return { source, file }
}
