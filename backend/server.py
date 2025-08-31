from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatCreate(BaseModel):
    title: str = "محادثة جديدة"

class MessageCreate(BaseModel):
    content: str
    chat_id: str

class ChatResponse(BaseModel):
    success: bool
    chat: Optional[Chat] = None
    message: Optional[str] = None

# Initialize AI Chat instances for different purposes
def get_ai_chat(chat_type: str = "general", session_id: str = None):
    """Get AI chat instance based on type and session"""
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    
    if chat_type == "educational":
        # Use Claude for educational content
        system_message = """أنت فيصل، مساعد تعليمي ذكي مخصص للطلاب الناطقين بالعربية. 
        مهمتك هي:
        1. تقديم شروحات واضحة ومبسطة للمفاهيم الدراسية
        2. مساعدة الطلاب في حل واجباتهم خطوة بخطوة دون حل كامل
        3. تقديم نصائح للدراسة والتنظيم
        4. تشجيع الطلاب وتحفيزهم على التعلم
        5. التفاعل بطريقة ودودة ومشجعة
        
        استخدم اللغة العربية في جميع ردودك وكن صبوراً ومساعداً."""
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=session_id or f"educational_{uuid.uuid4()}",
            system_message=system_message
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
    elif chat_type == "creative":
        # Use Gemini for creative tasks
        system_message = """أنت فيصل، مساعد إبداعي للطلاب. 
        ساعد في المشاريع الإبداعية، الكتابة، والعصف الذهني.
        كن مبدعاً ومحفزاً للخيال والابتكار.
        استخدم اللغة العربية دائماً."""
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=session_id or f"creative_{uuid.uuid4()}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.0-flash")
        
    else:
        # Use GPT-4o-mini for general chat (default)
        system_message = """أنت فيصل، مساعد ذكي للطلاب الناطقين بالعربية.
        أنت مفيد، ودود، ومساعد في جميع الأسئلة الأكاديمية والحياتية.
        تتحدث العربية بطلاقة وتفهم ثقافة الطلاب العرب.
        كن مشجعاً ومحفزاً دائماً."""
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=session_id or f"general_{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
    
    return chat

# Routes
@api_router.get("/")
async def root():
    return {"message": "فيصل - مساعد الطلاب الذكي"}

@api_router.post("/chats", response_model=ChatResponse)
async def create_chat(chat_data: ChatCreate):
    """Create a new chat"""
    try:
        new_chat = Chat(title=chat_data.title)
        chat_dict = new_chat.dict()
        chat_dict['_id'] = chat_dict['id']
        
        await db.chats.insert_one(chat_dict)
        return ChatResponse(success=True, chat=new_chat)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chat: {str(e)}")

@api_router.get("/chats", response_model=List[Chat])
async def get_chats():
    """Get all chats"""
    try:
        chats = await db.chats.find().sort("updated_at", -1).to_list(100)
        return [Chat(**{k: v for k, v in chat.items() if k != '_id'}) for chat in chats]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chats: {str(e)}")

@api_router.get("/chats/{chat_id}", response_model=Chat)
async def get_chat(chat_id: str):
    """Get a specific chat with messages"""
    try:
        chat = await db.chats.find_one({"id": chat_id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return Chat(**{k: v for k, v in chat.items() if k != '_id'})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat: {str(e)}")

@api_router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """Delete a chat"""
    try:
        result = await db.chats.delete_one({"id": chat_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return {"message": "Chat deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")

@api_router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, message_data: MessageCreate):
    """Send a message and get AI response"""
    try:
        # Get the chat
        chat = await db.chats.find_one({"id": chat_id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Create user message
        user_message = Message(
            role="user",
            content=message_data.content
        )
        
        # Add user message to chat
        chat['messages'].append(user_message.dict())
        
        # Check for custom commands first
        content_lower = message_data.content.lower().strip()
        
        # Custom credit command
        if content_lower == "ovn" or content_lower == "cailbxrn":
            ai_response = "This app has been created by Nawaf and Abdallah @OVN531 and @TL-cailburex on Instagram"
        else:
            # Determine chat type based on content
            if any(keyword in content_lower for keyword in ['رياضيات', 'فيزياء', 'كيمياء', 'تاريخ', 'جغرافيا', 'دراسة', 'واجب', 'امتحان']):
                chat_type = "educational"
            elif any(keyword in content_lower for keyword in ['قصة', 'شعر', 'إبداع', 'كتابة', 'تأليف', 'فن']):
                chat_type = "creative"
            else:
                chat_type = "general"
            
            # Get AI response
            ai_chat = get_ai_chat(chat_type, chat_id)
            user_msg = UserMessage(text=message_data.content)
            ai_response = await ai_chat.send_message(user_msg)
        
        # Create assistant message
        assistant_message = Message(
            role="assistant",
            content=ai_response
        )
        
        # Add assistant message to chat
        chat['messages'].append(assistant_message.dict())
        
        # Update chat title if it's the first message
        if len(chat['messages']) == 2:  # user + assistant message
            chat['title'] = message_data.content[:30] + "..." if len(message_data.content) > 30 else message_data.content
        
        # Update timestamp
        chat['updated_at'] = datetime.utcnow()
        
        # Save to database
        await db.chats.replace_one({"id": chat_id}, chat)
        
        # Return the updated chat
        return Chat(**{k: v for k, v in chat.items() if k != '_id'})
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@api_router.put("/chats/{chat_id}/title")
async def update_chat_title(chat_id: str, title_data: dict):
    """Update chat title"""
    try:
        result = await db.chats.update_one(
            {"id": chat_id},
            {"$set": {"title": title_data["title"], "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return {"message": "Title updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating title: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()