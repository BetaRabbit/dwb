const Moment = require('moment')
const MomentRange = require('moment-range')

const moment = MomentRange.extendMoment(Moment)

const range = moment.range('2016-01-01', '2016-12-31')

const days = Array.from(range.by('day')).map(d => ({
  path: '/api/sql',
  body: JSON.stringify({
    sql: `select count(*) from xd_ceip_ceip_uploadinfo_view where cdate='${d.format('YYYY-MM-DD')}'`
  }),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}))

console.log(JSON.stringify(days))
