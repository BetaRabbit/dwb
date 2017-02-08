import { Connection } from 'mssql'
import winston from 'winston'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import config from '../config'
import api from './api'

const port = process.env.PORT || 3000
const app = express()
const conn = new Connection(config)

app.use(cors())
app.use(bodyParser.json())

conn.connect()
  .then(() => {
    app.use('/api', api(conn))
  })
  .catch(err => winston.error(err))

app.listen(port, () => {
  winston.info(`${new Date()} App listening on port ${port}...`)
})
