const config = require('../../config')

export function errorCode (error) {
  if (error && error.code === 'EREQUEST') return 400
  if (error && error.code === 'ELOGIN') return 401
  if (error && error.code === 'EFORBIDDEN') return 403
  if (error && error.code === 'ETIMEOUT') return 504
  if (error && [ 'ConnectionError', 'TransactionError' ].indexOf(error.name) > -1) return 503

  return 400
}

const replacer = str => (match, p1, p2) => p1 + str + p2
const regExp = str => new RegExp(`(^|\\s+)${str}($|\\s+)`, 'g')

function santilizeStr (msg) {
  return String(msg)
    .replace(regExp(`${config[process.env.ENV || 'default'].server}(?::1433)?`), replacer('AZURE_DATAWAREHOUSE_SERVER'))
    .replace(regExp(config[process.env.ENV || 'default'].server.split('.')[0]), replacer('AZURE_DATAWAREHOUSE_SERVER'))
    .replace(regExp(config[process.env.ENV || 'default'].user), replacer('DEFAULT_USER'))
    .replace(regExp(config[process.env.ENV || 'default'].password), replacer('PASSWORD'))
}

export function santilize (data) {
  if (Array.isArray(data)) return data.map(item => santilize(item))

  if (typeof data === 'object') {
    Object.keys(data).forEach(key => {
      data[key] = santilize(data[key])
    })

    return data
  }

  return santilizeStr(data)
}
