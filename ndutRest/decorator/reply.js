module.exports = {
  t: function (payload, options = {}) {
    const scope = this.server
    const { _ } = scope.ndut.helper
    let result = payload
    if (scope.ndutI18N && (_.isPlainObject(payload) || options.error)) {
      if (options.error) result.message = scope.ndutI18N.helper.t(result.message, _.omit(options, ['error']))
    }
    this.send(result)
  }
}
