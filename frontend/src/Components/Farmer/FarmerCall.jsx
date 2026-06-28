// Mapa-Milihan/frontend/src/Components/Farmer/FarmerCall.jsx
import React, { useEffect, useRef } from 'react';
import { FiPhone, FiVideo, FiMic, FiX, FiVideoOff, FiMicOff } from 'react-icons/fi';

const FarmerCall = ({ 
  isOpen, 
  onClose, 
  callType, 
  targetUserName, 
  targetUserAvatar, 
  callStatus,
  isCaller,
  onEndCall,
  onAcceptCall,
  onRejectCall,
  onToggleVideo,
  onToggleAudio,
  isVideoEnabled,
  isAudioEnabled,
  localVideoRef,
  remoteVideoRef,
  getInitials
}) => {
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const ringIntervalRef = useRef(null);

  useEffect(() => {
    if (callStatus === 'ringing' && isOpen) {
      playRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [callStatus, isOpen]);

  const playRingtone = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      
      const now = ctx.currentTime;
      const ringDuration = 0.4;
      const pauseDuration = 0.2;
      const totalCycles = 8;
      
      for (let i = 0; i < totalCycles; i++) {
        const startTime = now + (i * (ringDuration + pauseDuration));
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.setValueAtTime(0, startTime + ringDuration);
      }

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(now);
      oscillator.stop(now + (totalCycles * (ringDuration + pauseDuration)));

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      let count = 0;
      ringIntervalRef.current = setInterval(() => {
        if (count >= totalCycles) {
          clearInterval(ringIntervalRef.current);
          return;
        }
        try {
          const beepOsc = ctx.createOscillator();
          const beepGain = ctx.createGain();
          beepOsc.type = 'sine';
          beepOsc.frequency.setValueAtTime(440, ctx.currentTime);
          beepGain.gain.setValueAtTime(0.15, ctx.currentTime);
          beepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          beepOsc.connect(beepGain);
          beepGain.connect(ctx.destination);
          beepOsc.start(ctx.currentTime);
          beepOsc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
        count++;
      }, 600);
      
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  };

  const stopRingtone = () => {
    try {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch (e) {}
        oscillatorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping ringtone:', error);
    }
  };

  if (!isOpen) return null;

  const getCallStatusText = () => {
    if (callStatus === 'ringing') {
      return isCaller ? 'Ringing...' : 'Incoming call...';
    }
    if (callStatus === 'connecting') return 'Connecting...';
    if (callStatus === 'connected') return 'Connected';
    if (callStatus === 'ended') return 'Call ended';
    if (callStatus === 'missed') return 'Missed call';
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="relative w-full max-w-lg mx-4">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full aspect-video bg-gray-800 rounded-lg object-cover"
          style={{ display: callType === 'video' ? 'block' : 'none' }}
        />
        
        {callType === 'audio' && (
          <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex flex-col items-center justify-center">
            {targetUserAvatar ? (
              <img src={targetUserAvatar} alt={targetUserName} className="w-32 h-32 rounded-full object-cover border-4 border-white/20" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-6xl font-bold text-white border-4 border-white/20">
                {getInitials(targetUserName)}
              </div>
            )}
            <p className="text-white text-lg font-semibold mt-4">{targetUserName}</p>
            <p className="text-gray-400 text-sm">{getCallStatusText()}</p>
            {!isCaller && callStatus === 'ringing' && (
              <div className="flex gap-2 mt-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        )}

        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-24 h-18 bg-gray-700 rounded-lg object-cover border-2 border-white shadow-lg"
          style={{ display: callType === 'video' ? 'block' : 'none' }}
        />

        {callType === 'video' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white">
            <div className="flex items-center gap-2">
              {targetUserAvatar && (
                <img src={targetUserAvatar} alt={targetUserName} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              )}
              <div>
                <p className="text-sm font-semibold">{targetUserName}</p>
                <p className="text-xs text-gray-300">{getCallStatusText()}</p>
                {!isCaller && callStatus === 'ringing' && (
                  <div className="flex justify-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          {!isCaller && callStatus === 'ringing' && (
            <>
              <button
                onClick={onRejectCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all transform hover:scale-110"
              >
                <FiPhone className="text-2xl transform rotate-135" />
              </button>
              <button
                onClick={onAcceptCall}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all transform hover:scale-110"
              >
                <FiPhone className="text-2xl" />
              </button>
            </>
          )}

          {(isCaller || callStatus === 'connected' || callStatus === 'connecting') && (
            <>
              <button
                onClick={onEndCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all transform hover:scale-110"
              >
                <FiPhone className="text-2xl transform rotate-135" />
              </button>

              {callType === 'video' && callStatus === 'connected' && (
                <button
                  onClick={onToggleVideo}
                  className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
                >
                  {isVideoEnabled ? <FiVideo className="text-base" /> : <FiVideoOff className="text-base" />}
                </button>
              )}

              {callStatus === 'connected' && (
                <button
                  onClick={onToggleAudio}
                  className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
                >
                  {isAudioEnabled ? <FiMic className="text-base" /> : <FiMicOff className="text-base" />}
                </button>
              )}
            </>
          )}
        </div>

        {(callStatus === 'ended' || callStatus === 'idle' || callStatus === 'missed') && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FarmerCall;