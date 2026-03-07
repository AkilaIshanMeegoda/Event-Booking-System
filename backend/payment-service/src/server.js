const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Payment Service: MongoDB connected');
    app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
