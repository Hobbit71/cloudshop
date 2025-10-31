import request from 'supertest';
import app from '../src/index';

describe('Auth Service', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register
      await request(app).post('/auth/register').send({
        email: 'login@example.com',
        password: 'Test1234',
        first_name: 'Test',
        last_name: 'User',
      });

      // Then login
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test1234',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
    });
  });
});

