const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5006;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Notification Service: MongoDB connected');
    app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
