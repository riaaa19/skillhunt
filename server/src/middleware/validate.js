export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted values.', fields: result.error.flatten().fieldErrors },
      })
    }
    req[source] = result.data
    next()
  }
}
