export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  console.error(`[api] ${req.method} ${req.path}: ${err.message}`)
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.statusCode ? err.message : 'An unexpected server error occurred.',
    },
  })
}
