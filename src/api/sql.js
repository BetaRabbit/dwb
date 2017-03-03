import { Router } from 'express'
import { Connection, Request } from 'mssql'
import timeout from 'connect-timeout'
import logger from '../utils/logger'
import config from '../../config'

export default conn => {
  const sql = Router({ mergeParams: true })

  sql.post('/', timeout(config.httpConnectionTimeout), haltOnTimedout, (req, res, next) => {
    logger.debug(`Set connection timeout to ${config.httpConnectionTimeout}`)
    req.setTimeout(config.httpConnectionTimeout)

    logger.debug('Request body: ', JSON.stringify(req.body))

    if (!req.body || !req.body.sql) {
      return next({
        error: {
          name: 'BadRequestError',
          message: 'Missing SQL command'
        },
        status: 400
      })
    }

    const requestTimeout = req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
    logger.debug(`requestTimeout: ${requestTimeout}`)

    if (requestTimeout > config.httpConnectionTimeout) {
      return next({
        error: {
          name: 'BadRequestError',
          message: `Request timeout exceeds the max value: ${config.httpConnectionTimeout}ms`
        },
        status: 400
      })
    }

    if (!conn[requestTimeout]) {
      logger.info(`Creating customize connection, requestTimeout: ${requestTimeout}`)

      conn[requestTimeout] = new Connection(Object.assign(
        {},
        config[process.env.ENV || 'default'],
        {
          options: Object.assign(
            {},
            config[process.env.ENV || 'default'].options,
            { requestTimeout }
          )
        }
       ))
    }

    if (conn[requestTimeout].connected) {
      logger.debug(`Using existing connection, requestTimeout: ${requestTimeout}ms`)

      handleQuery(req, res, next, conn[requestTimeout])
    } else {
      logger.debug(`Start connecting to database, requestTimeout: ${requestTimeout}ms`)

      conn[requestTimeout].connect()
        .then(() => {
          logger.debug('Connection established')

          handleQuery(req, res, next, conn[requestTimeout])
        })
        .catch(error => {
          logger.debug('Connection failed')

          next({
            error,
            status: 503,
            query: req.body.sql,
            timeout: req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
          })
        })
    }
  })

  return sql
}

function handleQuery (req, res, next, conn) {
  logger.info(`Start querying SQL command: ${req.body.sql}`)
  const started = Date.now()

  new Request(conn).query(req.body.sql)
    .then(data => {
      const duration = Date.now() - started

      res.status(200)
        .json({
          data,
          duration,
          query: req.body.sql,
          timeout: req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
        })
      logger.info(`Query SQL command completed: ${req.body.sql}, duration: ${duration}ms`)
    })
    .catch(error => {
      const duration = Date.now() - started

      next({
        error,
        status: 400,
        duration,
        query: req.body.sql,
        timeout: req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
      })
    })
}

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}
