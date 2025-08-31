import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Send, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Moon, 
  Sun, 
  Plus,
  MessageSquare,
  Settings,
  User
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import VideoChat from './VideoChat';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { currentChat, sendMessage, isTyping } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    await sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceCommand = (transcript) => {
    setMessage(transcript);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="border-b border-border p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600">
                <AvatarFallback className="text-white font-bold">ف</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                فيصل - مساعد الطلاب الذكي
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVideoActive(!isVideoActive)}
              className={isVideoActive ? 'bg-green-100 text-green-700' : ''}
            >
              {isVideoActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Video Chat Component */}
        {isVideoActive && (
          <div className="border-b border-border">
            <VideoChat onClose={() => setIsVideoActive(false)} />
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {!currentChat?.messages?.length && (
              <div className="text-center py-12">
                <Avatar className="h-16 w-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600">
                  <AvatarFallback className="text-white font-bold text-2xl">ف</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">مرحباً بك في فيصل!</h2>
                <p className="text-muted-foreground mb-6">مساعدك الذكي للتعلم والدراسة</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button 
                    variant="outline" 
                    className="p-4 h-auto flex-col items-start text-left hover:bg-accent"
                    onClick={() => setMessage('اشرح لي مفهوم الفيزياء الكمية')}
                  >
                    <div className="font-semibold mb-1">شرح المفاهيم العلمية</div>
                    <div className="text-sm text-muted-foreground">احصل على شروحات مبسطة للمواضيع المعقدة</div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="p-4 h-auto flex-col items-start text-left hover:bg-accent"
                    onClick={() => setMessage('ساعدني في حل واجب الرياضيات')}
                  >
                    <div className="font-semibold mb-1">حل الواجبات</div>
                    <div className="text-sm text-muted-foreground">احصل على مساعدة خطوة بخطوة</div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="p-4 h-auto flex-col items-start text-left hover:bg-accent"
                    onClick={() => setMessage('أعد جدول مذاكرة لامتحاناتي')}
                  >
                    <div className="font-semibold mb-1">تنظيم الدراسة</div>
                    <div className="text-sm text-muted-foreground">خطط لدراستك بفعالية</div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="p-4 h-auto flex-col items-start text-left hover:bg-accent"
                    onClick={() => setMessage('اختبرني في موضوع التاريخ')}
                  >
                    <div className="font-semibold mb-1">اختبارات تفاعلية</div>
                    <div className="text-sm text-muted-foreground">تدرب واختبر معلوماتك</div>
                  </Button>
                </div>
              </div>
            )}
            
            {currentChat?.messages?.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            
            {isTyping && (
              <MessageBubble 
                message={{ 
                  role: 'assistant', 
                  content: 'فيصل يكتب...', 
                  timestamp: new Date().toISOString(),
                  isTyping: true 
                }} 
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك هنا... أو استخدم الصوت"
                  className="pr-12 min-h-[44px] resize-none rounded-2xl"
                />
              </div>
              
              <VoiceRecorder
                isRecording={isRecording}
                onToggleRecording={setIsRecording}
                onVoiceCommand={handleVoiceCommand}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                size="sm"
                className="h-11 w-11 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center mt-2">
              فيصل قد يرتكب أخطاء. تحقق من المعلومات المهمة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;