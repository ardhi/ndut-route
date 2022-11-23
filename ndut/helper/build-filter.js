module.exports = function (request) {
  const { _ } = this.ndut.helper
  const filter = _.pick(request, ['user', 'site', 'rule', 'permission', 'isAdmin'])
  filter.reqParams = request.params
  filter.reqQuery = request.query
  filter.orWhere = []
  return filter
}