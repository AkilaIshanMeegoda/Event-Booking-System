const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5005;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Review Service: MongoDB connected');
    app.listen(PORT, () => console.log(`Review Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
