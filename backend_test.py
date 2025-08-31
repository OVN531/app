#!/usr/bin/env python3
"""
Backend Test Suite for Faisal AI Chat Application
Tests all API endpoints and AI model routing functionality
"""

import asyncio
import aiohttp
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from frontend environment
BACKEND_URL = "https://faisal-edu-chat.preview.emergentagent.com/api"

class FaisalBackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.created_chats = []  # Track created chats for cleanup
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Cleanup test session and created chats"""
        # Clean up created chats
        for chat_id in self.created_chats:
            try:
                await self.delete_chat(chat_id, cleanup=True)
            except:
                pass  # Ignore cleanup errors
                
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    async def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if "فيصل" in data.get("message", ""):
                        self.log_test("Root Endpoint", True, "Root endpoint returns correct Arabic message")
                        return True
                    else:
                        self.log_test("Root Endpoint", False, "Root endpoint message incorrect", {"response": data})
                        return False
                else:
                    self.log_test("Root Endpoint", False, f"Root endpoint returned status {response.status}")
                    return False
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Root endpoint failed: {str(e)}")
            return False
    
    async def create_chat(self, title: str = "محادثة اختبار") -> Optional[str]:
        """Create a new chat and return chat ID"""
        try:
            payload = {"title": title}
            async with self.session.post(f"{BACKEND_URL}/chats", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("chat"):
                        chat_id = data["chat"]["id"]
                        self.created_chats.append(chat_id)
                        self.log_test("Create Chat", True, f"Chat created successfully with ID: {chat_id}")
                        return chat_id
                    else:
                        self.log_test("Create Chat", False, "Chat creation response invalid", {"response": data})
                        return None
                else:
                    error_text = await response.text()
                    self.log_test("Create Chat", False, f"Chat creation failed with status {response.status}", {"error": error_text})
                    return None
        except Exception as e:
            self.log_test("Create Chat", False, f"Chat creation exception: {str(e)}")
            return None
    
    async def send_message(self, chat_id: str, content: str, expected_model_type: str = None) -> bool:
        """Send message to chat and verify response"""
        try:
            payload = {"content": content, "chat_id": chat_id}
            async with self.session.post(f"{BACKEND_URL}/chats/{chat_id}/messages", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if "messages" in data and len(data["messages"]) >= 2:
                        # Check if we got both user and assistant messages
                        user_msg = None
                        assistant_msg = None
                        for msg in data["messages"]:
                            if msg["role"] == "user" and msg["content"] == content:
                                user_msg = msg
                            elif msg["role"] == "assistant":
                                assistant_msg = msg
                        
                        if user_msg and assistant_msg:
                            # Check if response is in Arabic
                            arabic_chars = any('\u0600' <= char <= '\u06FF' for char in assistant_msg["content"])
                            if arabic_chars:
                                test_name = f"Send Message ({expected_model_type or 'general'})"
                                self.log_test(test_name, True, f"Message sent and Arabic response received", {
                                    "user_message": content,
                                    "assistant_response_length": len(assistant_msg["content"]),
                                    "has_arabic": arabic_chars
                                })
                                return True
                            else:
                                self.log_test("Send Message", False, "Assistant response not in Arabic", {
                                    "response": assistant_msg["content"][:100]
                                })
                                return False
                        else:
                            self.log_test("Send Message", False, "Missing user or assistant message", {"messages": data["messages"]})
                            return False
                    else:
                        self.log_test("Send Message", False, "Invalid message response structure", {"response": data})
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Send Message", False, f"Message sending failed with status {response.status}", {"error": error_text})
                    return False
        except Exception as e:
            self.log_test("Send Message", False, f"Message sending exception: {str(e)}")
            return False
    
    async def get_chats(self) -> bool:
        """Get all chats"""
        try:
            async with self.session.get(f"{BACKEND_URL}/chats") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        self.log_test("Get All Chats", True, f"Retrieved {len(data)} chats successfully")
                        return True
                    else:
                        self.log_test("Get All Chats", False, "Response is not a list", {"response": data})
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Get All Chats", False, f"Get chats failed with status {response.status}", {"error": error_text})
                    return False
        except Exception as e:
            self.log_test("Get All Chats", False, f"Get chats exception: {str(e)}")
            return False
    
    async def get_chat(self, chat_id: str) -> bool:
        """Get specific chat"""
        try:
            async with self.session.get(f"{BACKEND_URL}/chats/{chat_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    if "id" in data and data["id"] == chat_id:
                        self.log_test("Get Specific Chat", True, f"Retrieved chat {chat_id} successfully")
                        return True
                    else:
                        self.log_test("Get Specific Chat", False, "Chat ID mismatch", {"expected": chat_id, "received": data.get("id")})
                        return False
                elif response.status == 404:
                    self.log_test("Get Specific Chat", False, f"Chat {chat_id} not found (404)")
                    return False
                else:
                    error_text = await response.text()
                    self.log_test("Get Specific Chat", False, f"Get chat failed with status {response.status}", {"error": error_text})
                    return False
        except Exception as e:
            self.log_test("Get Specific Chat", False, f"Get chat exception: {str(e)}")
            return False
    
    async def delete_chat(self, chat_id: str, cleanup: bool = False) -> bool:
        """Delete chat"""
        try:
            async with self.session.delete(f"{BACKEND_URL}/chats/{chat_id}") as response:
                if response.status == 200:
                    if not cleanup:
                        self.log_test("Delete Chat", True, f"Chat {chat_id} deleted successfully")
                    return True
                elif response.status == 404:
                    if not cleanup:
                        self.log_test("Delete Chat", False, f"Chat {chat_id} not found (404)")
                    return False
                else:
                    error_text = await response.text()
                    if not cleanup:
                        self.log_test("Delete Chat", False, f"Delete chat failed with status {response.status}", {"error": error_text})
                    return False
        except Exception as e:
            if not cleanup:
                self.log_test("Delete Chat", False, f"Delete chat exception: {str(e)}")
            return False
    
    async def test_ai_model_routing(self):
        """Test AI model routing based on Arabic keywords"""
        test_cases = [
            {
                "content": "ساعدني في حل مسألة رياضيات صعبة",
                "expected_type": "educational",
                "description": "Educational (Math) - should use Claude"
            },
            {
                "content": "أريد كتابة قصة قصيرة عن الصداقة",
                "expected_type": "creative", 
                "description": "Creative (Story) - should use Gemini"
            },
            {
                "content": "ما هو الطقس اليوم؟",
                "expected_type": "general",
                "description": "General question - should use GPT-4o-mini"
            },
            {
                "content": "ساعدني في دراسة الفيزياء للامتحان",
                "expected_type": "educational",
                "description": "Educational (Physics) - should use Claude"
            },
            {
                "content": "أريد إبداع شعر عن الطبيعة",
                "expected_type": "creative",
                "description": "Creative (Poetry) - should use Gemini"
            }
        ]
        
        for i, test_case in enumerate(test_cases):
            # Create a new chat for each test
            chat_id = await self.create_chat(f"اختبار نموذج {i+1}")
            if chat_id:
                success = await self.send_message(
                    chat_id, 
                    test_case["content"], 
                    test_case["expected_type"]
                )
                if success:
                    self.log_test(f"AI Routing - {test_case['description']}", True, 
                                f"Successfully tested {test_case['expected_type']} model routing")
                else:
                    self.log_test(f"AI Routing - {test_case['description']}", False, 
                                f"Failed to test {test_case['expected_type']} model routing")
            else:
                self.log_test(f"AI Routing - {test_case['description']}", False, 
                            "Could not create chat for AI routing test")
    
    async def run_comprehensive_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Faisal AI Chat Backend Tests")
        print(f"🔗 Testing against: {BACKEND_URL}")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Test 1: Root endpoint
            await self.test_root_endpoint()
            
            # Test 2: Create chat
            chat_id = await self.create_chat("محادثة اختبار شاملة")
            
            if chat_id:
                # Test 3: Send message
                await self.send_message(chat_id, "مرحبا، كيف يمكنك مساعدتي؟")
                
                # Test 4: Get specific chat
                await self.get_chat(chat_id)
                
                # Test 5: Get all chats
                await self.get_chats()
                
                # Test 6: AI Model routing
                await self.test_ai_model_routing()
                
                # Test 7: Delete chat (will be done in cleanup)
                # We'll test delete with a separate chat
                delete_test_chat = await self.create_chat("محادثة للحذف")
                if delete_test_chat:
                    await self.delete_chat(delete_test_chat)
                    # Remove from cleanup list since we already deleted it
                    if delete_test_chat in self.created_chats:
                        self.created_chats.remove(delete_test_chat)
            
        finally:
            await self.cleanup()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

async def main():
    """Main test function"""
    tester = FaisalBackendTester()
    success = await tester.run_comprehensive_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend is working correctly.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())