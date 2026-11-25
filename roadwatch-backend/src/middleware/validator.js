const { validationResult } = require('express-validator');

/**
 * Middleware that checks validation results from express-validator rules
 * and returns standardized 400 Bad Request if any validation rule fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed for request data',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = { validate };

