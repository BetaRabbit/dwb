import { Connection } from 'mssql'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import config from '../config'
import api from './api'
import logger from './utils/logger'

const port = process.env.PORT || 3000

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(morgan('combined', {
  stream: {
    write: msg => logger.info(msg.trim())
  }
}))

const conn = new Connection(config[process.env.ENV || 'default'])
conn.connect()
  .then(() => {
    app.use('/api', api(conn))
  })
  .catch(err => logger.error(err))

process.on('SIGINT', () => {
  conn.close()
  setTimeout(() => process.exit(0), 300)
})

app.listen(port, () => {
  logger.info(`App listening on port ${port}...`)
})
