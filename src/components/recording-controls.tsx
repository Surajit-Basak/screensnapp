
'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Pause, Play, Square, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

type RecordingControlsProps = {
  onRecordingComplete: (blob: Blob) => void;
};

export function RecordingControls({
  onRecordingComplete,
}: RecordingControlsProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [includeAudio, setIncludeAudio] = useState(true);

  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);


  const cleanup = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }
    if (mediaRecorder.current) {
      mediaRecorder.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
        audioContext.current = null;
    }
    recordedChunks.current = [];
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
  };

  const handleStartRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true, // Request system audio as well
      });

      const videoTrack = displayStream.getVideoTracks()[0];
      // Listen for when the user stops sharing via browser UI
      videoTrack.onended = () => {
        handleStopRecording();
      };
      
      const finalTracks = [videoTrack];
      
      const systemAudioTrack = displayStream.getAudioTracks()[0];
      let micAudioTrack: MediaStreamTrack | null = null;

      if (includeAudio) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          micAudioTrack = micStream.getAudioTracks()[0];
        } catch (audioError) {
          console.warn('Could not get microphone audio.', audioError);
          const error = audioError as Error;
          if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
             toast({
                title: 'Microphone permission denied',
                description: 'Recording will continue without microphone audio.',
                variant: 'default',
            });
          }
        }
      }

      if (systemAudioTrack && micAudioTrack) {
        // Both system and mic audio are available, merge them
        const ctx = new AudioContext();
        audioContext.current = ctx;

        const systemSource = ctx.createMediaStreamSource(new MediaStream([systemAudioTrack]));
        const micSource = ctx.createMediaStreamSource(new MediaStream([micAudioTrack]));
        const destination = ctx.createMediaStreamDestination();

        systemSource.connect(destination);
        micSource.connect(destination);
        
        const combinedAudioTrack = destination.stream.getAudioTracks()[0];
        finalTracks.push(combinedAudioTrack);

      } else if (systemAudioTrack) {
        finalTracks.push(systemAudioTrack);
      } else if (micAudioTrack) {
        finalTracks.push(micAudioTrack);
      }
      
      const finalStream = new MediaStream(finalTracks);
      mediaStream.current = finalStream;
      recordedChunks.current = [];
      
      const options = {
        mimeType: 'video/webm; codecs=vp9,opus',
      };
      
      mediaRecorder.current = new MediaRecorder(mediaStream.current, options);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        onRecordingComplete(blob);
        cleanup();
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      const error = err as Error;
       if (error.name === 'NotAllowedError') {
        toast({
          title: 'Permission Denied',
          description: 'Screen recording permission is required to use this feature.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error starting recording',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
      cleanup();
    }
  };

  const handlePauseResumeRecording = () => {
    if (mediaRecorder.current) {
      if (isPaused) {
        mediaRecorder.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorder.current.pause();
        setIsPaused(true);
      }
    }
  };
  
  useEffect(() => {
    return () => {
      cleanup();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-center tracking-tight">
          Record Your Screen
        </h1>
        <div className="flex items-center space-x-2 my-2">
          <Switch id="audio-switch" checked={includeAudio} onCheckedChange={setIncludeAudio} disabled={isRecording} />
          <Label htmlFor="audio-switch" className="flex items-center gap-2 cursor-pointer">
            {includeAudio ? <Mic className="w-4 h-4"/> : <MicOff className="w-4 h-4 text-muted-foreground"/>}
            Include Microphone
          </Label>
        </div>
        <div className="flex w-full flex-col sm:flex-row gap-4">
          {!isRecording ? (
            <Button size="lg" className="flex-1 text-base" onClick={handleStartRecording}>
              <Video className="mr-2" /> Record Screen
            </Button>
          ) : (
            <>
              <Button size="lg" className="flex-1 text-base" variant="destructive" onClick={handleStopRecording}>
                <Square className="mr-2 animate-pulse" /> Stop Recording
              </Button>
              <Button size="lg" className="flex-1 text-base" variant="secondary" onClick={handlePauseResumeRecording}>
                {isPaused ? <Play className="mr-2" /> : <Pause className="mr-2" />} {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </>
          )}
        </div>
      </div>
  );
}
