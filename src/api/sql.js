import { Router } from 'express'
import { Request } from 'mssql'
import logger from '../utils/logger'

export default conn => {
  const sql = Router({ mergeParams: true })

  sql.post('/', (req, res, next) => {
    logger.debug('Request body: ', JSON.stringify(req.body))

    if (!req.body || !req.body.sql) {
      logger.error(`Missing SQL command`)
      return res.sendStatus(400)
    }

    logger.info(`Start querying SQL command: ${req.body.sql}`)

    const started = Date.now()
    new Request(conn).query(req.body.sql)
      .then(data => {
        const duration = Date.now() - started

        res.status(200)
          .json({
            data,
            duration,
            query: req.body.sql
          })
        logger.info(`Query SQL command completed: ${req.body.sql}, duration: ${duration}`)
      }).catch(error => {
        const duration = Date.now() - started
        next({
          error,
          duration,
          query: req.body.sql
        })
      })
  })

  sql.use((err, req, res, next) => {
    logger.error(err)
    res.status(400).json(err)
  })

  return sql
}
