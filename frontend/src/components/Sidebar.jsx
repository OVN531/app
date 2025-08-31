import React from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Plus, 
  MessageSquare, 
  Edit, 
  Trash2, 
  User,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const { chats, currentChatId, createNewChat, switchChat, deleteChat } = useChat();

  return (
    <div className={`fixed left-0 top-0 h-full bg-card border-r border-border transition-transform duration-300 z-30 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } w-64`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewChat}
            className="w-full justify-start gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4" />
            محادثة جديدة
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent ${
                  currentChatId === chat.id ? 'bg-accent' : ''
                }`}
                onClick={() => switchChat(chat.id)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{chat.title}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
            <User className="h-4 w-4" />
            الملف الشخصي
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
            <Settings className="h-4 w-4" />
            الإعدادات
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
            <HelpCircle className="h-4 w-4" />
            المساعدة
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
          
          <div className="pt-2 text-xs text-muted-foreground text-center">
            فيصل v1.0 - مساعد الطلاب
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;