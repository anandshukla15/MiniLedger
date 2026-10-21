import { query } from '../db';
import { Loan, LoanSummary } from '../types';

export interface CreateLoanDTO {
  friend_name: string;
  amount: number;
  due_date: string;
  notes?: string;
  receipt_url?: string;
}

export interface GetLoansFilter {
  status?: 'all' | 'pending' | 'repaid' | 'overdue';
  search?: string;
}

export class LoanService {
  /**
   * Create a new loan entry for a user
   */
  static async createLoan(userId: string, data: CreateLoanDTO): Promise<Loan> {
    const res = await query<Loan>(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, notes, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING 
         id,
         user_id,
         friend_name,
         amount::float as amount,
         to_char(due_date, 'YYYY-MM-DD') as due_date,
         is_repaid,
         repaid_at,
         notes,
         receipt_url,
         created_at,
         updated_at,
         (CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN true ELSE false END) as is_overdue;`,
      [
        userId,
        data.friend_name.trim(),
        data.amount,
        data.due_date,
        data.notes?.trim() || null,
        data.receipt_url || null,
      ]
    );

    return res.rows[0];
  }

  /**
   * Get all loans for a user with optional filter & search
   */
  static async getLoans(userId: string, filter?: GetLoansFilter): Promise<Loan[]> {
    let sql = `
      SELECT 
        id,
        user_id,
        friend_name,
        amount::float as amount,
        to_char(due_date, 'YYYY-MM-DD') as due_date,
        is_repaid,
        repaid_at,
        notes,
        receipt_url,
        created_at,
        updated_at,
        (CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN true ELSE false END) as is_overdue
      FROM loans
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (filter?.status === 'pending') {
      sql += ` AND is_repaid = false`;
    } else if (filter?.status === 'repaid') {
      sql += ` AND is_repaid = true`;
    } else if (filter?.status === 'overdue') {
      sql += ` AND is_repaid = false AND due_date < CURRENT_DATE`;
    }

    if (filter?.search && filter.search.trim()) {
      params.push(`%${filter.search.trim()}%`);
      sql += ` AND friend_name ILIKE $${params.length}`;
    }

    sql += ` ORDER BY due_date ASC, created_at DESC;`;

    const res = await query<Loan>(sql, params);
    return res.rows;
  }

  /**
   * Get a specific loan by ID
   */
  static async getLoanById(userId: string, loanId: string): Promise<Loan> {
    const res = await query<Loan>(
      `SELECT 
        id,
        user_id,
        friend_name,
        amount::float as amount,
        to_char(due_date, 'YYYY-MM-DD') as due_date,
        is_repaid,
        repaid_at,
        notes,
        receipt_url,
        created_at,
        updated_at,
        (CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN true ELSE false END) as is_overdue
      FROM loans
      WHERE id = $1 AND user_id = $2;`,
      [loanId, userId]
    );

    if (res.rowCount === 0) {
      throw new Error('Loan entry not found.');
    }

    return res.rows[0];
  }

  /**
   * Mark a loan as repaid
   */
  static async markAsRepaid(userId: string, loanId: string): Promise<Loan> {
    const res = await query<Loan>(
      `UPDATE loans
       SET 
         is_repaid = true,
         repaid_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING 
         id,
         user_id,
         friend_name,
         amount::float as amount,
         to_char(due_date, 'YYYY-MM-DD') as due_date,
         is_repaid,
         repaid_at,
         notes,
         receipt_url,
         created_at,
         updated_at,
         false as is_overdue;`,
      [loanId, userId]
    );

    if (res.rowCount === 0) {
      throw new Error('Loan entry not found or you are not authorized to update it.');
    }

    return res.rows[0];
  }

  /**
   * Delete a loan entry
   */
  static async deleteLoan(userId: string, loanId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM loans WHERE id = $1 AND user_id = $2;`,
      [loanId, userId]
    );

    if (res.rowCount === 0) {
      throw new Error('Loan entry not found or you are not authorized to delete it.');
    }

    return true;
  }

  /**
   * Summary calculation:
   * - total lent
   * - total repaid
   * - overdue amount
   * - pending amount
   * - counts
   */
  static async getSummary(userId: string): Promise<LoanSummary> {
    const res = await query(
      `SELECT
        COALESCE(SUM(amount), 0)::float AS "totalLent",
        COALESCE(SUM(CASE WHEN is_repaid = true THEN amount ELSE 0 END), 0)::float AS "totalRepaid",
        COALESCE(SUM(CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0)::float AS "overdueAmount",
        COALESCE(SUM(CASE WHEN is_repaid = false THEN amount ELSE 0 END), 0)::float AS "pendingAmount",
        COUNT(CASE WHEN is_repaid = false THEN 1 END)::int AS "activeLoansCount",
        COUNT(CASE WHEN is_repaid = true THEN 1 END)::int AS "repaidLoansCount",
        COUNT(CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN 1 END)::int AS "overdueLoansCount"
      FROM loans
      WHERE user_id = $1;`,
      [userId]
    );

    return res.rows[0];
  }
}
