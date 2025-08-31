import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load chats from backend on mount
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API}/chats`);
      setChats(response.data);
      if (response.data.length > 0 && !currentChatId) {
        setCurrentChatId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post(`${API}/chats`, {
        title: 'محادثة جديدة'
      });
      
      if (response.data.success) {
        const newChat = response.data.chat;
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${API}/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const updateChatTitle = async (chatId, newTitle) => {
    try {
      await axios.put(`${API}/chats/${chatId}/title`, {
        title: newTitle
      });
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const sendMessage = async (content) => {
    if (!currentChatId) {
      await createNewChat();
      return;
    }

    // Add user message optimistically
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...(chat.messages || []), userMessage],
            title: chat.messages?.length === 0 ? content.slice(0, 30) + '...' : chat.title
          }
        : chat
    ));

    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await axios.post(`${API}/chats/${currentChatId}/messages`, {
        content: content.trim(),
        chat_id: currentChatId
      });

      // Update the chat with the complete response from backend
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId ? response.data : chat
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic user message on error
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              messages: chat.messages?.filter(msg => msg.id !== userMessage.id) || []
            }
          : chat
      ));

      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'عذراً, حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString()
      };

      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              messages: [...(chat.messages || []), errorMessage]
            }
          : chat
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return (
    <ChatContext.Provider value={{
      chats,
      currentChat,
      currentChatId,
      isTyping,
      isLoading,
      createNewChat,
      switchChat,
      deleteChat,
      updateChatTitle,
      sendMessage,
      loadChats
    }}>
      {children}
    </ChatContext.Provider>
  );
};