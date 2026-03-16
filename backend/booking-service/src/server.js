const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5004;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Booking Service: MongoDB connected');
    app.listen(PORT, () => console.log(`Booking Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
