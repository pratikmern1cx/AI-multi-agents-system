# Multi-Agent AI Platform - API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe" // optional
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

**Errors:**
- `400` - Validation error (invalid email, password too short)
- `409` - Email already registered

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials

---

### Get Current User

Get authenticated user information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors:**
- `401` - Invalid or expired token

---

## Conversation Endpoints

### Create Conversation

Create a new conversation.

**Endpoint:** `POST /conversations`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My New Conversation" // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "My New Conversation",
  "status": "active",
  "context": {},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### List Conversations

Get all conversations for the authenticated user.

**Endpoint:** `GET /conversations`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Conversation 1",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Conversation

Get a specific conversation with all messages.

**Endpoint:** `GET /conversations/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "My Conversation",
  "status": "active",
  "context": {},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Hello, AI!",
      "metadata": {},
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "Hello! How can I help you?",
      "metadata": {
        "intent": {
          "category": "conversation",
          "confidence": 0.95
        },
        "tasks": []
      },
      "created_at": "2024-01-01T00:00:01Z"
    }
  ]
}
```

**Errors:**
- `404` - Conversation not found or doesn't belong to user

---

### Send Message

Send a message in a conversation and get AI response.

**Endpoint:** `POST /conversations/:id/messages`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Help me plan a project"
}
```

**Response:** `200 OK`
```json
{
  "userMessage": {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "user",
    "content": "Help me plan a project",
    "metadata": {},
    "created_at": "2024-01-01T00:00:00Z"
  },
  "assistantMessage": {
    "id": "uuid",
    "conversation_id": "uuid",
    "role": "assistant",
    "content": "I'll help you plan your project. Let me break this down into steps...",
    "metadata": {
      "intent": {
        "category": "planning",
        "confidence": 0.92,
        "entities": {}
      },
      "tasks": [
        {
          "id": "uuid",
          "title": "Analyze project requirements",
          "status": "completed"
        }
      ]
    },
    "created_at": "2024-01-01T00:00:05Z"
  },
  "metadata": {
    "intent": {
      "category": "planning",
      "confidence": 0.92,
      "entities": {}
    },
    "tasks": [...]
  }
}
```

**Processing Flow:**
1. User message saved to database
2. Orchestrator processes request:
   - Intent detection (classifies request type)
   - Memory retrieval (fetches relevant context)
   - Task planning (breaks into steps)
   - Agent execution (assigns to appropriate agents)
   - Result aggregation
3. Assistant response saved to database
4. Memory stored (Redis + Supabase with embeddings)

**Errors:**
- `404` - Conversation not found
- `400` - Validation error (empty content)

---

### Delete Conversation

Soft delete a conversation (sets status to 'deleted').

**Endpoint:** `DELETE /conversations/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `404` - Conversation not found

---

## Intent Categories

The system classifies user requests into these categories:

- `information_request` - User wants information or research
- `task_execution` - User wants to perform an action
- `planning` - User wants to plan or organize
- `analysis` - User wants data analysis or review
- `conversation` - General conversation or clarification

---

## Agent Types

The system uses these specialized agents:

### Planner Agent
- **Type:** `planner`
- **Purpose:** Strategic planning and task decomposition
- **Use Cases:** Project planning, goal setting, strategy

### Research Agent
- **Type:** `research`
- **Purpose:** Information gathering and synthesis
- **Use Cases:** Research, data collection, fact-finding

### Execution Agent
- **Type:** `execution`
- **Purpose:** Action execution and API calls
- **Use Cases:** Sending emails, API calls, file operations

### Review Agent
- **Type:** `review`
- **Purpose:** Quality assurance and validation
- **Use Cases:** Output verification, error checking

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here",
  "statusCode": 400
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

Default limits:
- 100 requests per minute per IP
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW`

When rate limit is exceeded:
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry in 60 seconds"
}
```

---

## Example Usage

### Complete Flow Example

```javascript
// 1. Register
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepass123',
    fullName: 'John Doe'
  })
});
const { token } = await registerResponse.json();

// 2. Create conversation
const convResponse = await fetch('http://localhost:3000/api/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ title: 'Project Planning' })
});
const conversation = await convResponse.json();

// 3. Send message
const msgResponse = await fetch(
  `http://localhost:3000/api/conversations/${conversation.id}/messages`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      content: 'Help me plan a marketing campaign for a new product'
    })
  }
);
const { assistantMessage } = await msgResponse.json();
console.log(assistantMessage.content);
```

---

## WebSocket Support (Coming Soon)

Real-time updates for:
- Agent status changes
- Task progress
- Live message streaming

---

## Pagination (Coming Soon)

For list endpoints, pagination will be added:

```
GET /conversations?page=1&limit=20
```

---

## Filtering (Coming Soon)

Filter conversations by status:

```
GET /conversations?status=active
```

---

## Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Conversation
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test Conversation"}'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Hello, AI!"}'
```

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Store JWT token securely** (localStorage or httpOnly cookie)
3. **Handle token expiration** (refresh or re-login)
4. **Validate input** on client side before sending
5. **Handle errors gracefully** with user-friendly messages
6. **Respect rate limits** to avoid 429 errors
7. **Use HTTPS in production** to protect tokens

---

## Support

For issues or questions:
- Check SETUP_GUIDE.md for setup help
- Review IMPLEMENTATION_GUIDE.md for architecture details
- Check backend logs for error details
