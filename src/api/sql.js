import { Router } from 'express'
import { Connection, Request } from 'mssql'
import timeout from 'connect-timeout'
import logger from '../utils/logger'
import config from '../../config'
import { errorCode, sanitize } from '../utils/index'

export default conn => {
  const sql = Router({ mergeParams: true })

  sql.post('/', timeout(config.httpConnectionTimeout), haltOnTimedout, (req, res, next) => {
    logger.debug(`Set connection timeout to ${config.httpConnectionTimeout}`)
    req.setTimeout(config.httpConnectionTimeout)

    logger.debug('Request body: ', JSON.stringify(req.body))

    // check sql parameter
    if (!req.body || !req.body.sql) {
      const error = {
        name: 'RequestError',
        code: 'EREQUEST',
        message: 'Missing SQL command'
      }

      return next(sanitize({
        error,
        status: errorCode(error)
      }))
    }

    // only allowed hosts can user credentials other than the default read only one
    let user = config[process.env.ENV || 'default'].user
    let password = config[process.env.ENV || 'default'].password

    if (req.body.user && req.body.password) {
      logger.debug(`user: ${req.body.user}`)

      if (config.allowedHosts.some(host => (new RegExp(host)).test(req.ip))) {
        logger.debug(`Host: ${req.ip} is allowed`)

        user = req.body.user
        password = req.body.password
      } else {
        logger.debug(`Host: ${req.ip} is not allowed`)

        const error = {
          name: 'ConnectionError',
          code: 'EFORBIDDEN',
          message: 'Client IP/Host address rejected'
        }

        return next(sanitize({
          error,
          status: errorCode(error)
        }))
      }
    }

    // check request timeout parameter
    const timeout = req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
    logger.debug(`requestTimeout: ${timeout}`)

    if (timeout > config.httpConnectionTimeout) {
      logger.debug(`requestTimeout ${timeout}ms exceeds the max value: ${config.httpConnectionTimeout}ms.`)
      const error = {
        name: 'RequestError',
        code: 'EREQUEST',
        message: `Request timeout exceeds the max value: ${config.httpConnectionTimeout}ms`
      }

      return next(sanitize({
        error,
        status: errorCode(error)
      }))
    }

    const connectionKey = `${timeout}_${user}`

    if (!conn[connectionKey]) {
      logger.info(`Creating customize connection, requestTimeout: ${timeout}, user: ${user}`)

      conn[connectionKey] = new Connection(Object.assign(
        {},
        config[process.env.ENV || 'default'],
        {
          options: Object.assign(
            {},
            config[process.env.ENV || 'default'].options,
            {
              requestTimeout: timeout
            }
          )
        },
        { user, password }
       ))
    }

    if (conn[connectionKey].connected) {
      logger.debug(`Using existing connection, requestTimeout: ${timeout}, user: ${user}`)

      handleQuery(req, res, next, conn[connectionKey], { user, timeout })
    } else {
      logger.debug(`Start connecting to database, requestTimeout: ${timeout}, user: ${user}`)

      conn[connectionKey].connect()
        .then(() => {
          logger.debug('Connection established')

          handleQuery(req, res, next, conn[connectionKey], { user, timeout })
        })
        .catch(error => {
          logger.debug('Connection failed')

          next(sanitize({
            error,
            timeout,
            user,
            status: errorCode(error),
            query: req.body.sql
          }))
        })
    }
  })

  return sql
}

function handleQuery (req, res, next, conn, options) {
  logger.info(`Start querying SQL command: ${req.body.sql}`)
  const { user, timeout } = options
  const started = Date.now()

  new Request(conn).query(req.body.sql)
    .then(data => {
      const duration = Date.now() - started

      res
        .status(200)
        .json({
          data,
          duration,
          timeout,
          user: sanitize(user),
          query: req.body.sql
        })
      logger.info(`Query SQL command completed: ${req.body.sql}, duration: ${duration}ms`)
    })
    .catch(error => {
      logger.error(`Query failed. Error: ${error}`)
      const duration = Date.now() - started

      next(sanitize({
        error,
        duration,
        timeout,
        user,
        query: req.body.sql,
        status: errorCode(error)
      }))
    })
}

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}
