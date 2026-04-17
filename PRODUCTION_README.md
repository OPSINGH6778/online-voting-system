# Secure Voting System - Production Setup

## Overview
A secure voting system built with Next.js 14, MongoDB Atlas, and TypeScript. Features OTP-based authentication, role-based access control, and production-ready security measures.

## Features
- 🔐 OTP-based authentication (email/SMS)
- 👥 Role-based access (Admin, User)
- 🗄️ MongoDB Atlas cloud database
- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS UI
- 🛡️ Rate limiting and security measures

## Production Deployment

### 1. Environment Variables
Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voting-system?retryWrites=true&w=majority

# Email Configuration (Optional - for real OTP delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@voting-system.com

# Security
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=production
```

### 2. MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Add your IP address to the whitelist (or 0.0.0.0/0 for all IPs)
4. Create a database user with read/write permissions
5. Get your connection string and update `MONGODB_URI`

### 3. Email Configuration (Optional)
For production OTP delivery via email:

1. **Gmail**: Enable 2FA, generate an App Password
2. **Other providers**: Configure SMTP settings accordingly
3. If not configured, OTPs will be logged to console (demo mode)

### 4. Rate Limiting
The system includes built-in rate limiting:
- 5 OTP verification attempts per 15 minutes per user
- Automatic retry-after headers
- In-memory storage (use Redis in production for scaling)

### 5. Security Features
- Password hashing with bcrypt
- OTP expiration (10 minutes)
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- HTTPS enforcement recommended

## Development

### Installation
```bash
npm install
```

### Database Setup
```bash
# Initialize database with sample data
npm run init-db

# Test database connection
npm run test-db
```

### Development Server
```bash
npm run dev
```

### Demo Credentials

- **Admin Account**:
  - Email: `admin@securevote.com`
  - Password: `SecureVote2024!`

- **User Accounts**:
  - Email: `voter1@securevote.com` / Password: `VoteSecure2024!`
  - Email: `voter2@securevote.com` / Password: `VoteSecure2024!`
  - Email: `voter3@securevote.com` / Password: `VoteSecure2024!`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login (sends OTP)
- `POST /api/auth/verify-otp` - Verify login OTP
- `POST /api/auth/verify-signup-otp` - Verify signup OTP
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Admin (Protected)
- `GET /api/admin/users` - List all users
- `POST /api/admin/elections` - Create election
- `GET /api/admin/elections` - List elections

### User (Protected)
- `GET /api/user/elections` - List available elections
- `POST /api/user/vote` - Cast vote

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password_hash: String,
  role: String (user|admin),
  is_verified: Boolean,
  created_at: Date
}
```

### OTPs Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  otp: String,
  expires_at: Date,
  used: Boolean,
  created_at: Date
}
```

### Votes Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  election_id: String,
  candidate_id: String,
  created_at: Date
}
```

## Security Considerations

### Production Checklist
- [ ] Configure MongoDB Atlas with proper IP whitelisting
- [ ] Set up SMTP for email OTP delivery
- [ ] Use HTTPS in production
- [ ] Configure proper session secrets
- [ ] Set up monitoring and logging
- [ ] Implement backup strategies
- [ ] Configure rate limiting with Redis for scaling
- [ ] Add input validation middleware
- [ ] Implement CSRF protection
- [ ] Set up proper CORS policies

### Rate Limiting
Currently implemented with in-memory storage. For production scaling:
```bash
npm install redis @upstash/rate-limit
# Configure Redis connection and update rate-limiter.ts
```

## Troubleshooting

### Common Issues
1. **MongoDB Connection Failed**: Check IP whitelist and connection string
2. **Email Not Sending**: Verify SMTP configuration
3. **OTP Not Working**: Check database connectivity and OTP expiration
4. **Rate Limiting**: Wait for reset period or clear rate limiter cache

### Logs
Check server logs for detailed error information:
```bash
npm run dev  # Development logs
# Production logs depend on your deployment platform
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

## License
This project is licensed under the MIT License.