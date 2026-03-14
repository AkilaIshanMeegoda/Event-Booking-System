const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5007;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Reporting Service: MongoDB connected');
    app.listen(PORT, () => console.log(`Reporting Service running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
