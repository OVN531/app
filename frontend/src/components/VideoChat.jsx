import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

const VideoChat = ({ onClose }) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initCamera();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`relative bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'h-64'}`}>
      {/* Video Display */}
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* AI Assistant Avatar Overlay */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          ف
        </div>

        {/* Status Indicators */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            متصل
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className={`h-10 w-10 rounded-full ${
              isAudioEnabled ? 'text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVideo}
            className={`h-10 w-10 rounded-full ${
              isVideoEnabled ? 'text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-10 w-10 rounded-full text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Chat Overlay for Video Mode */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-black/70 text-white p-3 rounded-lg max-w-xs">
            <p className="text-sm">
              مرحباً! أنا فيصل، مساعدك التعليمي. كيف يمكنني مساعدتك اليوم؟
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoChat;