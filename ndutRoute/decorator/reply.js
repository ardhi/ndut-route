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
      const compiled = _.template(source)
      html = compiled(locals)
    }
    this.send(html)
  }
}