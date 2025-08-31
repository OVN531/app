import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const VoiceRecorder = ({ isRecording, onToggleRecording, onVoiceCommand }) => {
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-SA';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript);
          onVoiceCommand(finalTranscript);
          onToggleRecording(false);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onToggleRecording(false);
        toast({
          title: "خطأ في التسجيل الصوتي",
          description: "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        onToggleRecording(false);
      };
    }
  }, [onToggleRecording, onVoiceCommand, toast]);

  const toggleRecording = () => {
    if (!isSupported) {
      toast({
        title: "غير مدعوم",
        description: "التسجيل الصوتي غير مدعوم في هذا المتصفح",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      onToggleRecording(false);
    } else {
      recognitionRef.current?.start();
      onToggleRecording(true);
      setTranscript('');
      toast({
        title: "بدء التسجيل",
        description: "تحدث الآن... سيتم تحويل كلامك إلى نص",
      });
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={toggleRecording}
      className={`h-11 w-11 rounded-2xl transition-all duration-200 ${
        isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''
      }`}
    >
      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};

export default VoiceRecorder;