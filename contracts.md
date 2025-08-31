# فيصل - AI Assistant Integration Contracts

## API Contracts

### Base URL
- Frontend: Uses `REACT_APP_BACKEND_URL` from environment variables
- Backend: All routes prefixed with `/api`

### Chat Management

#### Create New Chat
- **POST** `/api/chats`
- **Body**: `{ "title": "محادثة جديدة" }`
- **Response**: `{ "success": true, "chat": ChatObject }`

#### Get All Chats
- **GET** `/api/chats`
- **Response**: `Array<ChatObject>`

#### Get Specific Chat
- **GET** `/api/chats/{chat_id}`
- **Response**: `ChatObject` with messages

#### Delete Chat
- **DELETE** `/api/chats/{chat_id}`
- **Response**: `{ "message": "Chat deleted successfully" }`

#### Send Message
- **POST** `/api/chats/{chat_id}/messages`
- **Body**: `{ "content": "user message", "chat_id": "chat_id" }`
- **Response**: `ChatObject` with updated messages

#### Update Chat Title
- **PUT** `/api/chats/{chat_id}/title`
- **Body**: `{ "title": "new title" }`
- **Response**: `{ "message": "Title updated successfully" }`

### Data Models

#### Chat Object
```json
{
  "id": "uuid",
  "title": "string",
  "messages": [MessageObject],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### Message Object
```json
{
  "id": "uuid",
  "role": "user|assistant",
  "content": "string",
  "timestamp": "datetime"
}
```

## Mock Data Replacement

### Current Mock System
- File: `/app/frontend/src/data/mockData.js`
- Contains: `mockResponses` object with keyword-based responses
- Used by: `ChatContext.jsx` in `generateAIResponse` function

### Integration Changes Required

#### Frontend Changes
1. **Remove Mock Dependencies**
   - Remove `mockData.js` import from `ChatContext.jsx`
   - Replace `generateAIResponse` function with API calls
   - Update `sendMessage` function to use backend endpoints

2. **API Integration**
   - Use axios/fetch to call backend APIs
   - Handle loading states and errors
   - Implement proper error handling

3. **State Management Updates**
   - Store chats from backend API
   - Update chat list when new chats are created
   - Sync local state with server state

#### Backend Implementation
1. **AI Integration**
   - **Educational Content**: Claude-3-7-sonnet for academic questions
   - **Creative Tasks**: Gemini-2.0-flash for creative projects
   - **General Chat**: GPT-4o-mini for general conversations

2. **Content Routing Logic**
   - Keywords for educational: رياضيات، فيزياء، كيمياء، تاريخ، دراسة، واجب، امتحان
   - Keywords for creative: قصة، شعر، إبداع، كتابة، تأليف، فن
   - Default: general chat

3. **Database Schema**
   - Collection: `chats`
   - Documents store complete chat objects with messages array
   - Automatic timestamping and UUID generation

## Integration Steps

### Phase 1: Backend Setup ✅
- [x] Install emergentintegrations library
- [x] Add EMERGENT_LLM_KEY to environment
- [x] Implement chat management endpoints
- [x] Implement AI integration with content routing

### Phase 2: Frontend Integration
- [ ] Update ChatContext to use API calls
- [ ] Remove mock data dependencies
- [ ] Implement error handling and loading states
- [ ] Test real-time chat functionality

### Phase 3: Testing & Optimization
- [ ] Test all AI model routing
- [ ] Verify Arabic language responses
- [ ] Test chat persistence and retrieval
- [ ] Performance optimization

## Error Handling

### Backend Errors
- Database connection errors
- AI API failures
- Invalid chat/message IDs
- Authentication errors (future)

### Frontend Errors
- Network connectivity issues
- API response errors
- Loading state management
- User input validation

## Performance Considerations

### Backend
- Database indexing on chat IDs and timestamps
- AI response caching for common queries
- Rate limiting for API calls
- Connection pooling for database

### Frontend
- Lazy loading of chat history
- Message pagination for long conversations
- Optimistic updates for better UX
- Error retry mechanisms

## Security Notes
- Environment variables for sensitive keys
- CORS configuration for production
- Input sanitization for user messages
- Rate limiting to prevent abuse