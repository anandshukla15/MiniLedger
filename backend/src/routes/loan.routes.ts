import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { uploadReceipt } from '../middleware/upload.middleware';
import { createLoanSchema } from '../validators';

const router = Router();

// All loan endpoints require authentication
router.use(authenticateToken);

// Summary endpoint: total lent, total repaid, overdue amount
router.get('/summary', LoanController.getSummary);

// Loans CRUD
router.get('/', LoanController.getLoans);
router.post(
  '/',
  uploadReceipt.single('receipt'),
  validateRequest(createLoanSchema),
  LoanController.createLoan
);
router.get('/:id', LoanController.getLoanById);
router.patch('/:id/repay', LoanController.markAsRepaid);
router.delete('/:id', LoanController.deleteLoan);

export default router;
