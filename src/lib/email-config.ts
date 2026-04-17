// Email service configuration
// In production, configure with actual SMTP credentials

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export const getEmailConfig = (): EmailConfig | null => {
  // Check if SMTP environment variables are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // Email not configured
  }

  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM || 'noreply@voting-system.com',
  };
};

export const isEmailConfigured = (): boolean => {
  return getEmailConfig() !== null;
};