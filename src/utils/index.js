export function errorCode (error) {
  if (error && error.code === 'ELOGIN') return 401
  if (error && error.code === 'ETIMEOUT') return 504
  if (error && [ 'ConnectionError', 'TransactionError' ].indexOf(error.name) > -1) return 503

  return 400
}
