require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const reportRoutes = require('./routes/reportRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
app.use(morgan('combined'));

// Rate limiting disabled — all traffic shares one IP behind the ALB

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Reporting Service API', version: '1.0.0', description: 'Reporting & analytics microservice' },
    servers: [{ url: `http://localhost:${process.env.PORT || 5007}` }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }
  },
  apis: ['./src/routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'reporting-service', timestamp: new Date().toISOString() }));
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

module.exports = app;
