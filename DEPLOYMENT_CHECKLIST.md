# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.log statements (use logger)
- [ ] All TODO comments addressed
- [ ] Code reviewed and approved
- [ ] Git repository clean (no uncommitted changes)

### Environment Variables
- [ ] All .env variables documented in .env.example
- [ ] Production .env file created
- [ ] Secrets stored securely (not in code)
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are production-ready
- [ ] OpenAI API key has sufficient credits

### Database
- [ ] Supabase production project created
- [ ] DATABASE_SCHEMA.sql executed
- [ ] All tables created successfully
- [ ] Indexes verified
- [ ] Row-level security policies enabled
- [ ] Backup strategy configured
- [ ] Connection pooling configured

### Redis
- [ ] Production Redis instance provisioned
- [ ] Redis password set
- [ ] Persistence enabled (AOF or RDB)
- [ ] Memory limits configured
- [ ] Backup strategy in place

### Security
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Secrets not exposed in logs
- [ ] Authentication tested thoroughly

### Performance
- [ ] Database queries optimized
- [ ] Indexes added for common queries
- [ ] Connection pooling configured
- [ ] Caching strategy implemented
- [ ] Response times acceptable
- [ ] Load testing completed

### Monitoring
- [ ] Logging configured (production level)
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alerts configured for critical errors

### Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Load testing completed
- [ ] Security testing completed

## Deployment Steps

### Backend Deployment

#### Option 1: Docker
```bash
# Build image
docker build -t multi-agent-backend ./backend

# Run container
docker run -d \
  --name multi-agent-backend \
  -p 3000:3000 \
  --env-file .env \
  multi-agent-backend
```

#### Option 2: Node.js Server
```bash
cd backend
npm install --production
npm run build
NODE_ENV=production node dist/index.js
```

#### Option 3: Cloud Platform (Heroku, Railway, Render)
```bash
# Example: Railway
railway login
railway init
railway up
```

### Frontend Deployment

#### Build
```bash
cd frontend
npm install
npm run build
# Output in dist/
```

#### Option 1: Static Hosting (Vercel, Netlify)
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

#### Option 2: CDN (Cloudflare, AWS S3 + CloudFront)
```bash
# Upload dist/ to S3
aws s3 sync dist/ s3://your-bucket/
```

### Database Migration
```bash
# If using migrations
npm run db:migrate
```

### Environment Configuration

**Backend .env (Production):**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_KEY=prod-service-key

REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=strong-password

OPENAI_API_KEY=sk-prod-key
OPENAI_MODEL=gpt-4-turbo-preview

JWT_SECRET=very-strong-random-secret-change-this
JWT_EXPIRES_IN=7d

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

LOG_LEVEL=info
```

**Frontend .env (Production):**
```env
VITE_API_URL=https://api.yourdomain.com
```

## Post-Deployment

### Verification
- [ ] Health check endpoint returns OK
- [ ] Can register new user
- [ ] Can login
- [ ] Can create conversation
- [ ] Can send messages
- [ ] AI responds correctly
- [ ] Dashboard loads
- [ ] All features working

### Monitoring Setup
- [ ] Check logs for errors
- [ ] Verify metrics are being collected
- [ ] Test alert notifications
- [ ] Monitor response times
- [ ] Check error rates

### Performance Verification
- [ ] API response time < 100ms
- [ ] LLM response time acceptable
- [ ] Memory retrieval < 50ms
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Database connections stable

### Security Verification
- [ ] HTTPS working
- [ ] Authentication working
- [ ] Rate limiting working
- [ ] CORS configured correctly
- [ ] No sensitive data in logs
- [ ] Security headers present

## Scaling Checklist

### Horizontal Scaling
- [ ] Backend is stateless
- [ ] Load balancer configured
- [ ] Session storage in Redis (not memory)
- [ ] Database connection pooling
- [ ] Redis cluster for high availability

### Vertical Scaling
- [ ] Monitor resource usage
- [ ] Increase server resources as needed
- [ ] Optimize database queries
- [ ] Add caching where appropriate

## Backup Strategy

### Database Backups
- [ ] Automated daily backups
- [ ] Backup retention policy (30 days)
- [ ] Backup restoration tested
- [ ] Point-in-time recovery enabled

### Redis Backups
- [ ] AOF or RDB persistence enabled
- [ ] Backup schedule configured
- [ ] Backup restoration tested

### Code Backups
- [ ] Git repository backed up
- [ ] Tagged releases
- [ ] Deployment artifacts stored

## Disaster Recovery

### Rollback Plan
- [ ] Previous version tagged in Git
- [ ] Rollback procedure documented
- [ ] Database migration rollback tested
- [ ] Downtime window communicated

### Incident Response
- [ ] On-call rotation defined
- [ ] Incident response plan documented
- [ ] Communication channels established
- [ ] Escalation procedures defined

## Compliance

### Data Privacy
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy
- [ ] User data deletion process
- [ ] Privacy policy published

### Security
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Vulnerability scanning enabled
- [ ] Security patches applied

## Documentation

### User Documentation
- [ ] User guide published
- [ ] API documentation updated
- [ ] FAQ created
- [ ] Support channels documented

### Developer Documentation
- [ ] Architecture documented
- [ ] Deployment guide updated
- [ ] Troubleshooting guide created
- [ ] Runbook for common issues

## Cost Optimization

### Infrastructure
- [ ] Right-sized instances
- [ ] Auto-scaling configured
- [ ] Unused resources removed
- [ ] Cost alerts configured

### Services
- [ ] OpenAI usage monitored
- [ ] Database storage optimized
- [ ] Redis memory optimized
- [ ] CDN costs reviewed

## Maintenance

### Regular Tasks
- [ ] Weekly log review
- [ ] Monthly security updates
- [ ] Quarterly performance review
- [ ] Annual disaster recovery test

### Monitoring
- [ ] Daily health checks
- [ ] Weekly performance reports
- [ ] Monthly cost reports
- [ ] Quarterly security audits

## Production URLs

Document your production URLs:

- **Frontend**: https://app.yourdomain.com
- **Backend API**: https://api.yourdomain.com
- **Health Check**: https://api.yourdomain.com/health
- **Documentation**: https://docs.yourdomain.com
- **Status Page**: https://status.yourdomain.com

## Support Contacts

- **On-call Engineer**: [contact]
- **DevOps Team**: [contact]
- **Security Team**: [contact]
- **Product Owner**: [contact]

## Deployment Sign-off

- [ ] Technical Lead approval
- [ ] Product Owner approval
- [ ] Security Team approval
- [ ] DevOps Team approval

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Version**: _______________

**Notes**: _______________

---

## Quick Commands

### Check Status
```bash
# Health check
curl https://api.yourdomain.com/health

# Check logs
docker logs multi-agent-backend

# Check Redis
redis-cli -h your-redis-host ping

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Emergency Rollback
```bash
# Stop current version
docker stop multi-agent-backend

# Start previous version
docker run -d --name multi-agent-backend previous-image:tag
```

### View Logs
```bash
# Backend logs
docker logs -f multi-agent-backend

# Nginx logs
tail -f /var/log/nginx/access.log
```

---

**Good luck with your deployment! 🚀**
