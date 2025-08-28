# 🔒 Security Setup Instructions

## ⚠️ CRITICAL: Environment Variables Setup

**NEVER commit sensitive API keys or credentials to git!**

### 1. Setup Environment Files

1. Copy the example environment file:
   ```bash
   cp backend/main.env.example backend/main.env
   ```

2. Add your actual API keys to `backend/main.env`:
   - Get Eventbrite API key from: https://www.eventbrite.com/platform/api-keys
   - Get Ticketmaster API key from: https://developer.ticketmaster.com/
   - Get Unsplash API key from: https://unsplash.com/developers
   - Setup Supabase project at: https://supabase.com

### 2. Security Checklist

- [ ] `main.env` is added to `.gitignore`
- [ ] No API keys in committed code
- [ ] Environment variables are properly loaded
- [ ] Database credentials are secure
- [ ] HTTPS is enforced in production

### 3. Files to NEVER Commit

- `backend/main.env`
- `frontend/.env.local`
- `*.log` files
- `*.db` files
- `dump.rdb`
- `node_modules/`

### 4. Production Deployment

1. Set environment variables in your hosting platform
2. Use different keys for production vs development
3. Enable database security rules
4. Set up proper CORS policies
5. Use HTTPS for all API calls

## 🚨 If You Accidentally Committed Secrets

1. **Immediately rotate/regenerate ALL API keys**
2. Remove the sensitive data from git history
3. Add proper `.gitignore` rules
4. Re-deploy with new credentials