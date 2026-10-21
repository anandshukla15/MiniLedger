import { Response, NextFunction } from 'express';
import { LoanService } from '../services/loan.service';
import { AuthRequest } from '../types';

export class LoanController {
  /**
   * Create a new loan entry
   */
  static async createLoan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { friend_name, amount, due_date, notes } = req.body;

      // Check if a receipt file was uploaded
      let receipt_url: string | undefined = undefined;
      if (req.file) {
        // Construct accessible static path: /uploads/receipt-xxx.jpg
        receipt_url = `/uploads/${req.file.filename}`;
      } else if (req.body.receipt_url) {
        receipt_url = req.body.receipt_url;
      }

      const loan = await LoanService.createLoan(userId, {
        friend_name,
        amount: Number(amount),
        due_date,
        notes,
        receipt_url,
      });

      res.status(201).json({
        success: true,
        message: 'Loan entry recorded successfully',
        data: { loan },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get all loans for authenticated user
   */
  static async getLoans(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const status = req.query.status as any;
      const search = req.query.search as string;

      const loans = await LoanService.getLoans(userId, { status, search });

      res.status(200).json({
        success: true,
        count: loans.length,
        data: { loans },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get single loan by ID
   */
  static async getLoanById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = String(req.params.id);

      const loan = await LoanService.getLoanById(userId, loanId);

      res.status(200).json({
        success: true,
        data: { loan },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Loan entry not found',
      });
    }
  }

  /**
   * Mark loan as repaid
   */
  static async markAsRepaid(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = String(req.params.id);

      const loan = await LoanService.markAsRepaid(userId, loanId);

      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully',
        data: { loan },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark loan as repaid',
      });
    }
  }

  /**
   * Delete a loan entry
   */
  static async deleteLoan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const loanId = String(req.params.id);

      await LoanService.deleteLoan(userId, loanId);

      res.status(200).json({
        success: true,
        message: 'Loan entry deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete loan',
      });
    }
  }

  /**
   * Returns a summary: total lent, total repaid, overdue amount
   */
  static async getSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const summary = await LoanService.getSummary(userId);

      res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
