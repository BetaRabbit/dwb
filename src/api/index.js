import { Router } from 'express'
import { version } from '../../package.json'
import sql from './sql'

export default conn => {
  const router = Router({ mergeParams: true })

  // mount the sql resource
  router.use('/sql', sql(conn))

  // perhaps expose some API metadata at the root
  router.get('/', (req, res) => {
    res.json({ version })
  })

  return router
}
