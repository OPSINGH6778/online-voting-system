# MongoDB Setup Guide

## Connecting to MongoDB Atlas

Your MongoDB connection string is already configured in `.env.local`. You just need to replace the password:

### **Update Password**
1. Open `.env.local`
2. Replace `<db_password>` with your actual database password
3. The connection string should look like:
   ```
   MONGODB_URI=mongodb+srv://21a91a0547:YOUR_ACTUAL_PASSWORD@cluster0.tr8aq.mongodb.net/voting-system?retryWrites=true&w=majority
   ```

### **Initialize Database**
```bash
npm run init-db
```

### **Start Application**
```bash
npm run dev
```

## Database Schema:
- **Users**: User accounts with authentication
- **OTPs**: One-time passwords for verification
- **Votes**: Vote records with cryptographic hashes

## Security Notes:
- Never commit your `.env.local` file to version control
- Use strong passwords for your MongoDB Atlas database user
- Enable IP whitelisting in MongoDB Atlas for production