import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getEmailConfig } from './email-config';

// ── OTP ──────────────────────────────────────────────────────────────────────
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Password ─────────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true, message: 'Strong password' };
}

// ── Session Token ─────────────────────────────────────────────────────────────
export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}.${crypto.randomBytes(16).toString('hex')}`;
  return Buffer.from(payload).toString('base64');
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split('.');
    if (parts.length < 3) return null;
    const userId = parts[0];
    if (!/^[a-f\d]{24}$/i.test(userId)) return null;
    return userId;
  } catch {
    return null;
  }
}

export function createSession(userId: string): string {
  return createSessionToken(userId);
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── Email ─────────────────────────────────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  try {
    const emailConfig = getEmailConfig();
    if (!emailConfig) {
      console.log(`\n📧 EMAIL TO: ${to}`);
      console.log(`📧 SUBJECT: ${subject}`);
      console.log(`📧 TEXT: ${text}\n`);
      return true;
    }

    // Separate transport options from 'from' (nodemailer v6/v8 compatible)
    const { from, ...transportOptions } = emailConfig;
    const transporter = nodemailer.createTransport(transportOptions as any);
    await transporter.sendMail({ from, to, subject, html, text });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

export async function sendOTP(email: string, otp: string, type = 'login'): Promise<boolean> {
  const labels: Record<string, string> = {
    login: 'Login Verification', signup: 'Email Verification',
    reset: 'Password Reset', email_verify: 'Email Verification',
  };
  const label = labels[type] || 'Verification';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#22d3ee">🗳 Secure Voting System</h1>
      <h2 style="color:#f9fafb">${label} Code</h2>
      <p style="color:#d1d5db">Your one-time password is:</p>
      <div style="font-size:40px;font-weight:bold;color:#22d3ee;text-align:center;padding:24px;border:2px solid #1e40af;border-radius:12px;margin:20px 0;background:#0f172a;letter-spacing:12px">${otp}</div>
      <p style="color:#d1d5db">Expires in <strong style="color:#f59e0b">10 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:12px">Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.</p>
    </div>`;
  return sendEmail(email, `[SVS] ${label} OTP: ${otp}`, html, `Your OTP is: ${otp}. Expires in 10 minutes.`);
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#22d3ee">🗳 Secure Voting System</h1>
      <h2>Password Reset Request</h2>
      <p style="color:#d1d5db">Click below to reset your password. Link expires in <strong style="color:#f59e0b">1 hour</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="background:#22d3ee;color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Reset My Password</a>
      </div>
      <p style="color:#6b7280;font-size:12px">Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.</p>
    </div>`;
  return sendEmail(email, '[SVS] Password Reset Request', html, `Reset your password: ${resetUrl}`);
}

export async function sendWelcomeEmail(email: string, name: string, voterId: string): Promise<boolean> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#22d3ee">🗳 Welcome to Secure Voting System!</h1>
      <p style="color:#d1d5db">Hi <strong>${name}</strong>, your account is verified.</p>
      <div style="background:#0f172a;border:1px solid #1e40af;border-radius:8px;padding:16px;margin:16px 0">
        <p style="color:#9ca3af;margin:4px 0">Email: <strong style="color:#f9fafb">${email}</strong></p>
        <p style="color:#9ca3af;margin:4px 0">Voter ID: <strong style="color:#22d3ee">${voterId}</strong></p>
      </div>
      <p style="color:#6b7280;font-size:12px">Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.</p>
    </div>`;
  return sendEmail(email, '[SVS] Welcome — Your Account is Ready!', html, `Welcome ${name}! Voter ID: ${voterId}`);
}

export async function sendVoteConfirmationEmail(email: string, name: string, electionTitle: string, receiptId: string): Promise<boolean> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#fff;padding:32px;border-radius:12px">
      <h1 style="color:#22d3ee">🗳 Vote Confirmation</h1>
      <p style="color:#d1d5db">Hi <strong>${name}</strong>, your vote for <strong style="color:#22d3ee">${electionTitle}</strong> has been recorded.</p>
      <div style="background:#0f172a;border:1px solid #059669;border-radius:8px;padding:16px;margin:16px 0">
        <p style="color:#9ca3af">Receipt ID:</p>
        <p style="color:#34d399;font-family:monospace;font-size:14px;word-break:break-all">${receiptId}</p>
      </div>
      <p style="color:#6b7280;font-size:12px">Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.</p>
    </div>`;
  return sendEmail(email, '[SVS] Your Vote Has Been Recorded', html, `Vote receipt: ${receiptId}`);
}
