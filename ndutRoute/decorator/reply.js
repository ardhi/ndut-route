module.exports = {
  view: function (name, locals) {
    const scope = this.server
    const { _, getNdutConfig } = scope.ndut.helper
    const cfg = getNdutConfig('ndut-route')
    let html = ''
    this.header('Content-Type', 'text/html; charset=' + cfg.charset)
    if (scope.ndutView) {
      const theme = _.get(this.request, 'site.pref.theme', 'default')
      html = scope.ndutView.helper.renderTpl(name, locals, theme)
    } else {
      const { source } = scope.ndutRoute.helper.renderTpl(name)
      const compiled = _.template(source)
      html = compiled(locals)
    }
    this.send(html)
  }
}