exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
  }
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
};
