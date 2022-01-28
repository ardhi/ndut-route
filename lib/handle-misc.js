module.exports = async function () {
  const { _, getNdutConfig, dumpError } = this.ndut.helper
  const { getUrl } = this.ndutRoute.helper
  const config = getNdutConfig('ndut-route')
  const authConfig = getNdutConfig('ndut-auth')
  this.setErrorHandler((error, request, reply) => {
    dumpError(error)
    if (!error.isBoom) error = this.Boom.boomify(error)
    if (error.output.statusCode === 401) {
      if (config.unauthenticated === 'popup' && _.get(authConfig, 'strategy.basic') &&
        (request.authStrategy === 'basic' || request.authStrategy === false)) {
        reply.header('WWW-Authenticate', 'Basic')
        reply.code(error.output.statusCode).send(error.message)
        return
      }
      if (config.unauthenticated === 'login') {
        reply.redirect(getUrl('/login', 'auth'))
        return
      }
    }
    reply.code(error.output.statusCode).send(error.message) // TODO: error page
  })
  this.setNotFoundHandler({
    preHandler: this.rateLimit ? this.rateLimit() : undefined
  }, (request, reply) => {
    throw new this.Boom.Boom('Page not found', { statusCode: 404 })
  })
}
