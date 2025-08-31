import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockResponses } from '../data/mockData';

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

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('faisal-chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
      }
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('faisal-chats', JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'محادثة جديدة',
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = (chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const updateChatTitle = (chatId, newTitle) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
  };

  const sendMessage = async (content) => {
    if (!currentChatId) {
      createNewChat();
      return;
    }

    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 0 ? content.slice(0, 30) + '...' : chat.title
          }
        : chat
    ));

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate AI response
    const aiResponse = generateAIResponse(content);
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    };

    // Add AI response
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, assistantMessage] }
        : chat
    ));

    setIsTyping(false);
  };

  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Find matching response based on keywords
    for (const [keywords, responses] of Object.entries(mockResponses)) {
      if (keywords.split(',').some(keyword => message.includes(keyword.trim()))) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Default responses for unmatched queries
    const defaultResponses = [
      "هذا سؤال ممتاز! دعني أفكر في أفضل طريقة لشرح هذا الموضوع لك.",
      "أفهم تماماً ما تسأل عنه. سأقوم بتوضيح الأمر خطوة بخطوة.",
      "سؤال رائع! هذا موضوع مهم يحتاج إلى شرح مفصل.",
      "دعني أساعدك في فهم هذا الموضوع بطريقة بسيطة وواضحة.",
      "أقدر فضولك العلمي! سأعطيك إجابة شاملة ومفيدة."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return (
    <ChatContext.Provider value={{
      chats,
      currentChat,
      currentChatId,
      isTyping,
      createNewChat,
      switchChat,
      deleteChat,
      updateChatTitle,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};