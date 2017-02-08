import winston from 'winston'
import { Router } from 'express'
import { Request } from 'mssql'

export default conn => {
  const sql = Router({ mergeParams: true })

  sql.post('/', (req, res, next) => {
    if (!req.body && !req.body.sql) {
      winston.error(`${new Date()} Missing SQL command`)
      return res.sendStatus(400)
    }

    winston.info(`${new Date()} Start querying SQL command: ${req.body.sql}`)

    const started = Date.now()
    new Request(conn).query(req.body.sql)
      .then(data => {
        res.status(200)
          .json({
            data,
            query: req.body.sql,
            duration: Date.now() - started
          })
        winston.info(`${new Date()} Query SQL command completed: ${req.body.sql}`)
      }).catch(error => {
        next({
          error,
          query: req.body.sql,
          duration: Date.now() - started
        })
      })
  })

  sql.use((err, req, res, next) => {
    winston.error(`${new Date()} ${err}`)
    res.status(400).json(err)
  })

  return sql
}
