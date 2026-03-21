const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

jest.setTimeout(30000);

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/reporting-service-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Reporting Service', () => {
  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('reporting-service');
    });
  });

  describe('GET /api/reports/dashboard', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/reports/dashboard');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/reports/revenue', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/reports/revenue');
      expect(res.statusCode).toBe(401);
    });
  });
});
