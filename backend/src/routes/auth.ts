import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../utils/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-change-this'; // Use env!

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

// Send verification email
async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verify your AirMailer account',
    html: `
      <h1>Welcome to AirMailer!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can ignore this email.</p>
    `,
    text: `Welcome to AirMailer! Please verify your email by visiting: ${verificationUrl}`
  });
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    const pool = getPool();
    const userResult = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ success: true, message: 'Login successful!', token, emailVerified: user.email_verified });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[LOGIN ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Login failed', error: errorMessage });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    let decoded: { userId: number; iat: number; exp: number } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number; iat: number; exp: number };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        decoded = jwt.decode(token) as { userId: number; iat: number; exp: number };
        if (!decoded) {
          return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const now = Math.floor(Date.now() / 1000);
        if (now - decoded.exp > 7 * 24 * 60 * 60) {
          return res.status(401).json({ success: false, message: 'Token expired too long ago' });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }
    const pool = getPool();
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    const newToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ success: true, message: 'Token refreshed successfully', token: newToken });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[REFRESH ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Token refresh failed', error: process.env.NODE_ENV === 'development' ? errorMessage : undefined });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return res.status(400).json({ success: false, message: 'Invalid email format or too long' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password) || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be 8-128 characters with uppercase, lowercase, number, and special character' });
    }
    const pool = getPool();
    const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkResult.rowCount !== null && checkResult.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, verification_token, verification_expires) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, passwordHash, verificationToken, verificationExpires]
    );
    const userId = userResult.rows[0].id;

    const apiKey = `am_${uuidv4()}`;
    await pool.query('INSERT INTO api_keys (user_id, api_key) VALUES ($1, $2)', [userId, apiKey]);

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      token,
      apiKey,
      emailVerified: false
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SIGNUP ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to create account', error: errorMessage });
  }
});

// POST /api/auth/verify-password
router.post('/verify-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required' });
    }
    const pool = getPool();
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    res.status(200).json({ success: true, message: 'Password verified' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[VERIFY-PASSWORD ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Verification failed', error: errorMessage });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required' });
    }

    const pool = getPool();
    const userResult = await pool.query(
      'SELECT id, verification_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    const user = userResult.rows[0];
    if (new Date() > user.verification_expires) {
      return res.status(400).json({ success: false, message: 'Verification token expired' });
    }

    await pool.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.status(200).json({ success: true, message: 'Email verified successfully!' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[VERIFY-EMAIL ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Verification failed', error: errorMessage });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const jwtToken = authHeader.split(' ')[1];
    let userId: number;
    try {
      const decoded = jwt.verify(jwtToken, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const pool = getPool();
    const userResult = await pool.query(
      'SELECT email, email_verified, verification_attempts, last_verification_sent FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Check rate limiting: max 3 per hour
    const now = new Date();
    if (user.last_verification_sent && user.verification_attempts >= 3) {
      const hoursSinceLast = (now.getTime() - new Date(user.last_verification_sent).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 1) {
        return res.status(429).json({ success: false, message: 'Too many verification emails sent. Try again later.' });
      }
      // Reset attempts after 1 hour
      await pool.query('UPDATE users SET verification_attempts = 0 WHERE id = $1', [userId]);
    }

    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verification_token = $1, verification_expires = $2, verification_attempts = verification_attempts + 1, last_verification_sent = $3 WHERE id = $4',
      [verificationToken, verificationExpires, now, userId]
    );

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({ success: true, message: 'Verification email sent!' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RESEND-VERIFICATION ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to send verification email', error: errorMessage });
  }
});

// POST /api/auth/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const pool = getPool();
    const userResult = await pool.query('SELECT email_verified FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, emailVerified: userResult.rows[0].email_verified });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[STATUS ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to get status', error: errorMessage });
  }
});

// Send password reset email
async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Reset your AirMailer password',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your AirMailer account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, you can ignore this email.</p>
    `,
    text: `Password reset requested. Reset your password here: ${resetUrl}`
  });
}

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const pool = getPool();
    const userResult = await pool.query('SELECT id, last_reset_sent FROM users WHERE email = $1', [email]);

    if (userResult.rowCount === 0) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = userResult.rows[0];

    // Rate limiting: max 3 reset attempts per hour
    if (user.last_reset_sent && new Date(user.last_reset_sent).getTime() > Date.now() - 3600000) {
      const attemptsResult = await pool.query('SELECT reset_attempts FROM users WHERE id = $1', [user.id]);
      if (attemptsResult.rows[0].reset_attempts >= 3) {
        return res.status(429).json({ success: false, message: 'Too many reset attempts. Please try again later.' });
      }
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2, reset_attempts = reset_attempts + 1, last_reset_sent = CURRENT_TIMESTAMP WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[FORGOT-PASSWORD ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to process request', error: errorMessage });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const pool = getPool();
    const userResult = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > CURRENT_TIMESTAMP',
      [token]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const userId = userResult.rows[0].id;

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, reset_attempts = 0 WHERE id = $2',
      [passwordHash, userId]
    );

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[RESET-PASSWORD ERROR]', errorMessage);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: errorMessage });
  }
});

export default router;