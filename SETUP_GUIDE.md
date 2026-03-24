# Multi-Agent AI Platform - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Redis installed and running
- Supabase account (free tier works)
- OpenAI API key

## Step-by-Step Setup

### 1. Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Copy the entire contents of `DATABASE_SCHEMA.sql`
4. Paste and execute in the SQL Editor
5. Verify tables are created in the Table Editor

### 2. Redis Setup

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Option B: Local Installation**

Windows (using Chocolatey):
```bash
choco install redis-64
redis-server
```

Mac (using Homebrew):
```bash
brew install redis
brew services start redis
```

Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Supabase (from your Supabase project settings)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Logging
LOG_LEVEL=info
```

**Finding Supabase Keys:**
1. Go to your Supabase project
2. Click "Settings" → "API"
3. Copy "Project URL" → SUPABASE_URL
4. Copy "anon public" key → SUPABASE_ANON_KEY
5. Copy "service_role" key → SUPABASE_SERVICE_KEY (keep this secret!)

**Getting OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to OPENAI_API_KEY

Start the backend:
```bash
npm run dev
```

You should see:
```
Redis connected
Agents registered
Server listening on 0.0.0.0:3000
```

Test the backend:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

### 5. Test the System

1. Open http://localhost:5173 in your browser
2. Click "Register" to create an account
3. Fill in email, password, and name
4. You'll be redirected to the chat interface
5. Click "New Conversation" (+ button)
6. Type a message like: "Help me plan a project"
7. Watch the AI agents process your request!

## Verification Checklist

- [ ] Redis is running (`redis-cli ping` returns PONG)
- [ ] Supabase tables are created (check Table Editor)
- [ ] Backend starts without errors
- [ ] Health check returns OK
- [ ] Frontend loads at localhost:5173
- [ ] Can register a new user
- [ ] Can create a conversation
- [ ] Can send and receive messages

## Common Issues

### Issue: "Redis connection failed"
**Solution:** Make sure Redis is running
```bash
redis-cli ping
```

### Issue: "Supabase error: relation does not exist"
**Solution:** Run the DATABASE_SCHEMA.sql in Supabase SQL Editor

### Issue: "OpenAI API error"
**Solution:** 
- Check your API key is correct
- Verify you have credits in your OpenAI account
- Check rate limits

### Issue: "JWT error" or "Unauthorized"
**Solution:** 
- Make sure JWT_SECRET is set in .env
- Clear browser localStorage and re-login

### Issue: "CORS error"
**Solution:** Backend and frontend should be running on different ports (3000 and 5173)

## Architecture Overview

```
User Browser (localhost:5173)
    ↓
Frontend (React + Vite)
    ↓ HTTP/WebSocket
Backend API (localhost:3000)
    ↓
Orchestrator
    ↓
Agents (Planner, Research, Execution, Review)
    ↓
OpenAI API
    ↓
Memory System
    ├─ Redis (short-term)
    └─ Supabase (long-term + embeddings)
```

## What Happens When You Send a Message

1. **Frontend** sends message to `/api/conversations/:id/messages`
2. **Backend** receives and authenticates request
3. **ConversationService** saves user message to Supabase
4. **Orchestrator** processes the request:
   - **IntentDetector** classifies the request type
   - **MemoryManager** retrieves relevant context
   - **TaskPlanner** breaks request into tasks
   - **Agents** execute tasks (Planner → Research → Execution → Review)
5. **Results** aggregated and saved
6. **Memory** stored in Redis (session) and Supabase (long-term with embeddings)
7. **Response** sent back to frontend
8. **Frontend** displays assistant message

## Next Steps

Now that your MVP is running:

1. **Test Different Queries:**
   - "Research the latest AI trends"
   - "Help me plan a marketing campaign"
   - "Analyze this data: [paste data]"

2. **Monitor Logs:**
   - Backend logs show agent activity
   - Check Supabase logs for database queries

3. **Explore Dashboard:**
   - Click "Dashboard" to see stats
   - View conversation history
   - See active agents

4. **Phase 2 Features (Next):**
   - Add tool integrations (email, calendar)
   - Implement workflow automation
   - Add WebSocket for real-time updates

## Development Tips

- Use `LOG_LEVEL=debug` for verbose logging
- Check Redis keys: `redis-cli KEYS *`
- Monitor Supabase logs in dashboard
- Use browser DevTools Network tab to debug API calls

## Production Deployment

For production deployment, see `DEPLOYMENT.md` (coming soon).

Key considerations:
- Use environment variables for all secrets
- Enable HTTPS
- Set up proper CORS
- Use Redis cluster
- Scale backend horizontally
- Monitor with logging service

## Support

If you encounter issues:
1. Check this guide first
2. Review IMPLEMENTATION_GUIDE.md
3. Check logs for error details
4. Verify all environment variables are set

---

**Congratulations! Your Multi-Agent AI Platform is now running! 🎉**
