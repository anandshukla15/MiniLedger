import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number must be at least 8 characters')
    .max(20, 'Phone number cannot exceed 20 characters')
    .regex(/^[+]?[0-9\s-]{8,20}$/, 'Please enter a valid phone number (e.g. +919876543210)'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number must be at least 8 characters'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric digits'),
});

export const createLoanSchema = z.object({
  friend_name: z
    .string()
    .trim()
    .min(2, 'Friend name must be at least 2 characters')
    .max(120, 'Friend name must not exceed 120 characters'),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Amount must be greater than 0')
    .max(100000000, 'Amount is too large'),
  due_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be formatted as YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), 'Due date must be a valid calendar date'),
  notes: z.string().trim().max(1000, 'Notes must be within 1000 characters').optional(),
});
