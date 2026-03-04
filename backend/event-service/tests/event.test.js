const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Event = require('../src/models/Event');

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/event-service-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await Event.deleteMany({});
  await mongoose.connection.close();
});

describe('Event Service', () => {
  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('event-service');
    });
  });

  describe('GET /api/events', () => {
    it('should return empty events list', async () => {
      const res = await request(app).get('/api/events');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.events).toEqual([]);
    });

    it('should support pagination params', async () => {
      const res = await request(app).get('/api/events?page=1&limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/events', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).post('/api/events').send({ title: 'Test' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/events/:id/availability', () => {
    it('should return 404 for invalid event id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/events/${fakeId}/availability`);
      expect(res.statusCode).toBe(404);
    });
  });
});
