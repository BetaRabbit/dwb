import { Router } from 'express'
import { Connection, Request } from 'mssql'
import logger from '../utils/logger'
import config from '../../config'

export default conn => {
  const sql = Router({ mergeParams: true })

  sql.post('/', (req, res, next) => {
    logger.debug('Request body: ', JSON.stringify(req.body))

    if (!req.body || !req.body.sql) {
      return next({
        error: {
          name: 'Argument Error',
          message: 'Missing SQL command'
        }
      })
    }

    const timeout = req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
    logger.debug(req.body.timeout)
    logger.debug(config[process.env.ENV || 'default'].options.requestTimeout)
    logger.debug(`timeout: ${timeout}`)

    if (!conn[timeout]) {
      logger.info(`Creating customize connection, requestTimeout: ${timeout}`)

      conn[timeout] = new Connection(Object.assign(
        {},
        config[process.env.ENV || 'default'],
        {
          options: Object.assign(
            {},
            config[process.env.ENV || 'default'].options,
            { requestTimeout: timeout }
          )
        }
       ))
    }

    if (conn[timeout].connected) {
      logger.debug(`Using existing connection, requestTimeout: ${timeout}`)

      handleQuery(conn[timeout], req, res, next)
    } else {
      logger.debug(`Start connecting to database, requestTimeout: ${timeout}`)

      conn[timeout].connect()
        .then(() => {
          logger.debug('Connection established')
          handleQuery(conn[timeout], req, res, next)
        })
        .catch(error => {
          logger.debug('Connection failed')
          next({
            error,
            query: req.body.sql,
            timeout: req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
          })
        })
    }
  })

  sql.use((err, req, res, next) => {
    logger.error(JSON.stringify(err))
    res.status(400).json(err)
  })

  return sql
}

function handleQuery (conn, req, res, next) {
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
      logger.info(`Query SQL command completed: ${req.body.sql}, duration: ${duration}`)
    })
    .catch(error => {
      const duration = Date.now() - started

      next({
        error,
        duration,
        query: req.body.sql,
        timeout: req.body.timeout || config[process.env.ENV || 'default'].options.requestTimeout
      })
    })
}
