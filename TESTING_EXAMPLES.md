# Testing Examples

Test your Multi-Agent AI Platform with these examples.

## Manual Testing Flow

### 1. Register & Login

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Save the token for subsequent requests.

### 2. Create Conversation

```bash
TOKEN="your-token-here"

curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Project Planning Session"
  }'
```

**Expected Response:**
```json
{
  "id": "conv-uuid",
  "user_id": "user-uuid",
  "title": "Project Planning Session",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 3. Test Different Agent Scenarios

#### Scenario 1: Planning Request (Planner Agent)

```bash
CONV_ID="your-conversation-id"

curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Help me plan a marketing campaign for a new mobile app"
  }'
```

**Expected:**
- Intent: `planning`
- Agent: Planner Agent
- Response: Strategic plan with steps

#### Scenario 2: Research Request (Research Agent)

```bash
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "What are the latest trends in AI and machine learning?"
  }'
```

**Expected:**
- Intent: `information_request`
- Agent: Research Agent
- Response: Comprehensive research summary

#### Scenario 3: Execution Request (Execution Agent)

```bash
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Create a task list for building a website"
  }'
```

**Expected:**
- Intent: `task_execution`
- Agent: Execution Agent
- Response: Actionable task list

#### Scenario 4: Analysis Request (Review Agent)

```bash
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Review this code: function add(a, b) { return a + b; }"
  }'
```

**Expected:**
- Intent: `analysis`
- Agent: Review Agent
- Response: Code review with suggestions

### 4. Test Memory System

**First Message:**
```bash
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "My favorite color is blue and I love pizza"
  }'
```

**Second Message (should remember context):**
```bash
curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "What is my favorite color?"
  }'
```

**Expected:** AI should remember "blue" from previous message.

### 5. List Conversations

```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Project Planning Session",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:05:00Z"
    }
  ]
}
```

## Frontend Testing

### 1. Registration Flow

1. Open http://localhost:5173
2. Click "Register"
3. Fill in:
   - Email: test@example.com
   - Password: password123
   - Name: Test User
4. Click "Create Account"
5. Should redirect to chat interface

### 2. Chat Flow

1. Click "+ New Conversation"
2. Type: "Help me plan a project"
3. Press Enter or click Send
4. Watch for:
   - User message appears immediately
   - "Thinking..." indicator shows
   - AI response appears with intent classification
   - Intent metadata shows (e.g., "Intent: planning (92%)")

### 3. Dashboard

1. Click "Dashboard" button
2. Verify:
   - Conversation count is correct
   - Total messages count
   - 4 active agents shown
   - Recent conversations listed

### 4. Multiple Conversations

1. Create 3 different conversations
2. Send messages in each
3. Switch between conversations
4. Verify messages persist correctly

## Testing Agent Behavior

### Test Intent Detection

Send these messages and verify correct intent:

| Message | Expected Intent |
|---------|----------------|
| "What is the weather?" | information_request |
| "Help me plan a trip" | planning |
| "Send an email to John" | task_execution |
| "Review this document" | analysis |
| "Hello, how are you?" | conversation |

### Test Task Planning

**Message:** "I need to launch a product. Help me plan."

**Expected Tasks:**
1. Market research
2. Product development
3. Marketing strategy
4. Launch execution
5. Post-launch review

### Test Memory Retrieval

**Conversation 1:**
- "My name is John and I work at Acme Corp"

**Conversation 2 (same user):**
- "What company do I work at?"

**Expected:** Should retrieve from long-term memory (Supabase embeddings)

## Error Testing

### Test Invalid Token

```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "Authorization: Bearer invalid-token"
```

**Expected:** `401 Unauthorized`

### Test Missing Fields

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected:** `400 Bad Request` - "password is required"

### Test Rate Limiting

Send 101 requests in 1 minute:

```bash
for i in {1..101}; do
  curl -X GET http://localhost:3000/health
done
```

**Expected:** Last request returns `429 Too Many Requests`

## Performance Testing

### Test Response Time

```bash
time curl -X POST http://localhost:3000/api/conversations/$CONV_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content": "Hello"}'
```

**Expected:**
- Without LLM processing: < 100ms
- With LLM processing: 2-5 seconds

### Test Concurrent Requests

```bash
# Install Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/conversations
```

**Expected:** All requests succeed

## Database Testing

### Verify Tables Created

In Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Expected:** 11 tables listed

### Verify Embeddings

```sql
SELECT id, content, embedding 
FROM memory_embeddings 
LIMIT 5;
```

**Expected:** Embeddings are 1536-dimensional vectors

### Test Semantic Search

```sql
-- This should work after sending some messages
SELECT * FROM match_memory_embeddings(
  (SELECT embedding FROM memory_embeddings LIMIT 1),
  0.7,
  5,
  'user-uuid'
);
```

## Redis Testing

### Check Session Storage

```bash
redis-cli KEYS "session:*"
```

**Expected:** List of session keys

### Check TTL

```bash
redis-cli TTL "session:your-conversation-id"
```

**Expected:** Number between 0 and 3600 (1 hour)

## Integration Testing

### Full User Journey

1. Register new user
2. Login
3. Create conversation
4. Send 5 different messages
5. Check dashboard statistics
6. Create second conversation
7. Switch between conversations
8. Delete first conversation
9. Logout
10. Login again
11. Verify second conversation still exists

**All steps should work without errors.**

## Monitoring

### Check Logs

**Backend logs:**
```bash
cd backend
npm run dev
# Watch for:
# - "Redis connected"
# - "Agents registered"
# - "Server listening"
# - Intent detection logs
# - Agent execution logs
```

**Supabase logs:**
- Go to Supabase Dashboard
- Click "Logs"
- Filter by "API" or "Database"
- Check for errors

### Check Redis

```bash
redis-cli INFO stats
```

**Look for:**
- `total_commands_processed`
- `keyspace_hits`
- `keyspace_misses`

## Troubleshooting Tests

### If Tests Fail

1. **Check Backend is Running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check Redis:**
   ```bash
   redis-cli ping
   ```

3. **Check Environment Variables:**
   ```bash
   cd backend
   cat .env
   # Verify all keys are set
   ```

4. **Check Database:**
   - Login to Supabase
   - Verify tables exist
   - Check for errors in logs

5. **Check OpenAI API:**
   - Verify API key is valid
   - Check you have credits
   - Test with OpenAI playground

## Success Criteria

✅ All API endpoints return expected responses
✅ Intent detection works correctly
✅ Agents execute tasks successfully
✅ Memory stores and retrieves correctly
✅ Frontend displays messages properly
✅ Dashboard shows accurate statistics
✅ Authentication works end-to-end
✅ Error handling works as expected
✅ Rate limiting prevents abuse
✅ Performance meets targets

## Next Steps

After successful testing:
1. Add unit tests for services
2. Add integration tests for API
3. Add E2E tests with Playwright
4. Set up CI/CD pipeline
5. Add monitoring and alerting

---

**Happy Testing! 🧪**
