# Quick Start Guide

Get your Multi-Agent AI Platform running in 5 minutes!

## Prerequisites

- Node.js 18+
- Redis
- Supabase account
- OpenAI API key

## 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 2. Setup Database

1. Create Supabase project at https://supabase.com
2. Copy `DATABASE_SCHEMA.sql` contents
3. Paste in Supabase SQL Editor and execute

## 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=sk-your-key
JWT_SECRET=change-this-to-random-string
```

## 4. Start Redis

```bash
# Using Docker (easiest)
docker run -d -p 6379:6379 redis:alpine

# Or install locally and run
redis-server
```

## 5. Start Backend

```bash
cd backend
npm run dev
```

Should see:
```
Redis connected
Agents registered
Server listening on 0.0.0.0:3000
```

## 6. Start Frontend

```bash
cd frontend
npm run dev
```

Opens at http://localhost:5173

## 7. Test It!

1. Open http://localhost:5173
2. Click "Register"
3. Create account
4. Start chatting with AI agents!

## Troubleshooting

**Redis not connecting?**
```bash
redis-cli ping  # Should return PONG
```

**Backend errors?**
- Check all .env variables are set
- Verify Supabase keys are correct
- Check OpenAI API key has credits

**Frontend not loading?**
- Make sure backend is running on port 3000
- Check browser console for errors

## What's Next?

- Read SETUP_GUIDE.md for detailed setup
- Check API_DOCUMENTATION.md for API details
- Review IMPLEMENTATION_GUIDE.md for architecture

## Quick Test Commands

```bash
# Test health
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
```

That's it! You're ready to build with AI agents! 🚀
