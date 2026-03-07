exports.serviceAuth = (req, res, next) => {
  const serviceKey = req.header('x-service-key');
  if (!serviceKey || serviceKey !== process.env.SERVICE_KEY) {
    return res.status(403).json({ success: false, message: 'Service authentication failed.' });
  }
  next();
};
