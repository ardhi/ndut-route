module.exports = {
  view: function (name, locals) {
    const scope = this.server
    const { _, getNdutConfig } = scope.ndut.helper
    const cfg = getNdutConfig('ndut-route')
    let html = ''
    this.header('Content-Type', 'text/html; charset=' + cfg.charset)
    if (scope.ndutView) {
      html = scope.ndutView.helper.renderTpl(name, locals, this.request)
    } else {
      const { source } = scope.ndutRoute.helper.renderTpl(name)
      const opts = {}
      if (this.request.i18n) opts.imports = { t: this.request.i18n.t }
      const compiled = _.template(source, opts)
      html = compiled(locals)
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
