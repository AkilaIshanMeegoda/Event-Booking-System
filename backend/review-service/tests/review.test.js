const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Review = require('../src/models/Review');

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/review-service-test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await Review.deleteMany({});
  await mongoose.connection.close();
});

describe('Review Service', () => {
  describe('GET /health', () => {
    it('should return service health', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('review-service');
    });
  });

  describe('POST /api/reviews', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).post('/api/reviews').send({
        eventId: '507f1f77bcf86cd799439011',
        rating: 5,
        title: 'Great!',
        comment: 'Loved it'
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/reviews/event/:eventId', () => {
    it('should return empty reviews for unknown event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/reviews/event/${fakeId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.reviews).toEqual([]);
    });
  });
});
