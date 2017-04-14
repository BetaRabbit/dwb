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
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(morgan('combined', {
  stream: {
    write: msg => logger.info(msg.trim())
  }
}))

const timeout = config[process.env.ENV || 'default'].options.requestTimeout
const user = config[process.env.ENV || 'default'].user
const conn = {
  [`${timeout}_${user}`]: new Connection(config[process.env.ENV || 'default'])
}

app.use('/api', api(conn))

process.on('SIGINT', () => {
  // close all connections
  for (const key of Object.keys()) {
    conn[key].close()
  }

  setTimeout(() => process.exit(0), 1000)
})

// global error handling
app.use(function (err, req, res, next) {
  logger.error(JSON.stringify(err))
  res.status(err.status).json(err)
})

app.listen(port, () => {
  logger.info(`App listening on port ${port}...`)
})
