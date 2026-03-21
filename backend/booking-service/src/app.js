require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Booking Service API', version: '1.0.0', description: 'Booking managements microservice' },
    servers: [{ url: `http://localhost:${process.env.PORT || 5004}` }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }
  },
  apis: ['./src/routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'booking-service', timestamp: new Date().toISOString() }));
app.use('/api/bookings', bookingRoutes);

app.use(errorHandler);

module.exports = app;
