import React, { useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { 
  Copy, 
  Volume2, 
  VolumeX, 
  RefreshCcw, 
  ThumbsUp, 
  ThumbsDown 
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const MessageBubble = ({ message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const isUser = message.role === 'user';
  const isTyping = message.isTyping;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  const handleSpeak = () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'ar-SA';
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 mt-1 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-blue-500 text-white">أ</AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
            ف
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block p-4 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-card border border-border'
          } ${isTyping ? 'animate-pulse' : ''}`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Message Actions */}
        {!isTyping && (
          <div className={`flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-muted-foreground mr-2">
              {formatTime(message.timestamp)}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            {!isUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleSpeak}
                >
                  {isPlaying ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;