module.exports = async function () {
  const { _, getNdutConfig, dumpError } = this.ndut.helper
  const { getUrl } = this.ndutRoute.helper
  const authCfg = getNdutConfig('ndut-auth')
  this.setErrorHandler((error, request, reply) => {
    dumpError(error)
    if (!error.isBoom) error = this.Boom.boomify(error)
    // TODO: use interception
    if (error.output.statusCode === 401 && authCfg) {
      if (authCfg.route.unauthenticated === 'goBasicPopup' && _.get(authCfg, 'strategy.basic') &&
        (request.authStrategy === 'basic' || request.authStrategy === false)) {
        reply
          .header('WWW-Authenticate', 'Basic')
          .code(error.output.statusCode)
          .send(error.message)
      } else if (authCfg.route.unauthenticated === 'goLogin') {
        reply
          .redirect(getUrl('/login', 'auth'))
      }
    } else {
      reply.code(error.output.statusCode)
      _.forOwn(error.data, (v, k) => {
        reply.header(`X-Error-Data-${_.kebabCase(k)}`, v)
      })
      reply.send(error.message) // TODO: error page
    }
  })
  this.setNotFoundHandler({
    preHandler: this.rateLimit ? this.rateLimit() : undefined
  }, (request, reply) => {
    throw new this.Boom.Boom('Page not found', { statusCode: 404 })
  })
}
