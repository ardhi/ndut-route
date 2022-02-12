const getSource = function (scope, name, locals = {}) {
  locals.page = locals.page || {}
  const { _ } = scope.ndut.helper
  const { source } = scope.ndutRoute.helper.renderTpl(name)
  const opts = {}
  const t = this.request.i18n ? this.request.i18n.t : ((val) => (val))
  opts.imports = { t }
  const compiled = _.template(source, opts)
  return compiled(locals)
}

module.exports = {
  view: function (name, locals = {}) {
    const scope = this.server
    const { _, getNdutConfig } = scope.ndut.helper
    const cfg = getNdutConfig('ndut-route')
    let html = ''
    this.header('Content-Type', 'text/html; charset=' + cfg.charset)
    if (scope.ndutView) {
      html = scope.ndutView.helper.renderTpl(name, locals, this.request)
    } else {
      const content = getSource.call(this, scope, name, locals)
      html = getSource.call(this, scope, 'route:/layout', { content })
    }
    this.send(html)
  },
  t: function (payload, options) {
    const scope = this.server
    const { _ } = scope.ndut.helper
    let result = payload
    if (this.request.i18n && _.isString(payload)) result = this.request.i18n.t(payload, options)
    this.send(result)
  }
}
