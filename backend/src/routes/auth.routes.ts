import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { sendOtpSchema, verifyOtpSchema } from '../validators';

const router = Router();

router.post('/send-otp', validateRequest(sendOtpSchema), AuthController.sendOtp);
router.post('/verify-otp', validateRequest(verifyOtpSchema), AuthController.verifyOtp);
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
