import winston from 'winston'
import { Router } from 'express'
import { Request } from 'mssql'

export default conn => {
  const sql = Router({ mergeParams: true })

  sql.post('/', (req, res, next) => {
    if (!req.body || !req.body.sql) {
      winston.error(`${new Date()} Missing SQL command`)
      return res.sendStatus(400)
    }

    winston.info(`${new Date()} Start querying SQL command: ${req.body.sql}`)

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
        winston.info(`${new Date()} Query SQL command completed: ${req.body.sql}, duration: ${duration}`)
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
    winston.error(`${new Date()} ${err.error.message}`)
    res.status(400).json(err)
  })

  return sql
}
