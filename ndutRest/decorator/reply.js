module.exports = {
  t: function (payload, options = {}) {
    const scope = this.server
    const { _ } = scope.ndut.helper
    let result = payload
    if (this.request.i18n && (_.isPlainObject(payload) || options.error)) {
      if (options.error) result.message = this.request.i18n.t(result.message, _.omit(options, ['error']))
    }
    this.send(result)
  }
}
