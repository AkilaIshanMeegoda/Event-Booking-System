const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Notification = require('../src/models/Notification');

jest.setTimeout(30000);

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/notification-service-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await Notification.deleteMany({});
  await mongoose.connection.close();
});

describe('Notification Service', () => {
  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('notification-service');
    });
  });

  describe('POST /api/notifications', () => {
    it('should reject without service key', async () => {
      const res = await request(app).post('/api/notifications').send({ userId: 'u1', type: 'general', title: 'Test', message: 'Test msg' });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/notifications/my', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/notifications/my');
      expect(res.statusCode).toBe(401);
    });
  });
});
