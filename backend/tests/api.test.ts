import request from 'supertest';
import app from '../src/app';
import { pool, query } from '../src/db';
import path from 'path';
import fs from 'fs';

describe('MiniLedger Backend API Integration Tests', () => {
  const testPhone = '+919999988888';
  let authToken = '';
  let userId = '';
  let createdLoanId = '';

  beforeAll(async () => {
    // Ensure test database tables are ready
    const schemaSql = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf-8');
    await query(schemaSql);

    // Clean up test phone records
    await query(`DELETE FROM users WHERE phone = $1;`, [testPhone]);
  });

  afterAll(async () => {
    // Clean up any test records created
    if (userId) {
      await query(`DELETE FROM loans WHERE user_id = $1;`, [userId]);
      await query(`DELETE FROM users WHERE id = $1;`, [userId]);
    }
    await query(`DELETE FROM otps WHERE phone = $1;`, [testPhone]);
    await pool.end();
  });

  describe('1. Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.app).toBe('MiniLedger API');
    });
  });

  describe('2. Authentication Flow (Mock OTP)', () => {
    let mockOtpCode = '';

    it('should reject OTP request with invalid phone format', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should generate and log mock OTP for valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mockOtp).toBeDefined();
      mockOtpCode = res.body.mockOtp;
    });

    it('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully verify OTP and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: mockOtpCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.phone).toBe(testPhone);

      authToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    it('should fetch current authenticated user profile (/api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(userId);
      expect(res.body.data.user.phone).toBe(testPhone);
    });
  });

  describe('3. Loan Management APIs', () => {
    it('should block unauthenticated requests to loan endpoints', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
    });

    it('should validate loan creation inputs (e.g. missing friend_name or negative amount)', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friend_name: '',
          amount: -50,
          due_date: 'invalid-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create an active loan entry', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friend_name: 'Aakash Verma',
          amount: 1500,
          due_date: dueDate,
          notes: 'Team dinner advance',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loan.friend_name).toBe('Aakash Verma');
      expect(res.body.data.loan.amount).toBe(1500);
      expect(res.body.data.loan.is_repaid).toBe(false);
      expect(res.body.data.loan.is_overdue).toBe(false);

      createdLoanId = res.body.data.loan.id;
    });

    it('should create an overdue loan entry and compute is_overdue as true', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 3);
      const dueDate = yesterday.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friend_name: 'Deepak Rao',
          amount: 3000,
          due_date: dueDate,
          notes: 'Overdue grocery share',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.loan.is_overdue).toBe(true);
    });

    it('should support receipt photo upload (Bonus requirement)', async () => {
      // Create a small dummy image buffer for testing
      const testBuffer = Buffer.from('mock receipt image content');

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .field('friend_name', 'Sunil Kumar')
        .field('amount', '850.50')
        .field('due_date', '2026-12-01')
        .field('notes', 'Cab receipt attached')
        .attach('receipt', testBuffer, 'receipt_sample.png');

      expect(res.status).toBe(201);
      expect(res.body.data.loan.receipt_url).toContain('/uploads/receipt-');
    });

    it('should list loans for the user with filters and search', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loans.length).toBeGreaterThanOrEqual(3);

      // Search filter
      const searchRes = await request(app)
        .get('/api/loans?search=Aakash')
        .set('Authorization', `Bearer ${authToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.loans.length).toBe(1);
      expect(searchRes.body.data.loans[0].friend_name).toBe('Aakash Verma');
    });

    it('should mark a loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/loans/${createdLoanId}/repay`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loan.is_repaid).toBe(true);
      expect(res.body.data.loan.repaid_at).toBeDefined();
    });
  });

  describe('4. Summary Endpoint', () => {
    it('should accurately calculate total lent, total repaid, and overdue amount', async () => {
      const res = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const summary = res.body.data.summary;

      // 1500 (repaid) + 3000 (overdue) + 850.50 (active) = 5350.50
      expect(summary.totalLent).toBe(5350.50);
      expect(summary.totalRepaid).toBe(1500);
      expect(summary.overdueAmount).toBe(3000);
      expect(summary.pendingAmount).toBe(3850.50);
      expect(summary.activeLoansCount).toBe(2);
      expect(summary.repaidLoansCount).toBe(1);
      expect(summary.overdueLoansCount).toBe(1);
    });

    it('should also work on alias endpoint /api/summary', async () => {
      const res = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalLent).toBe(5350.50);
    });
  });
});
