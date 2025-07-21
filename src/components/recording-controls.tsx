
'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Pause, Play, Square, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ScreenshotOverlay } from './screenshot-overlay';
import { db } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';


type RecordingControlsProps = {
  onRecordingComplete: (blob: Blob) => void;
};

export function RecordingControls({
  onRecordingComplete,
}: RecordingControlsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);


  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const cleanup = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }
    if (mediaRecorder.current) {
      mediaRecorder.current = null;
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
        video: { cursor: 'always' },
        audio: true, // Request system audio as well
      });

      const videoTrack = displayStream.getVideoTracks()[0];
      // This is the key! Listen for when the user stops sharing via browser UI
      videoTrack.onended = () => {
        handleStopRecording();
      };
      
      const finalStreamTracks = [videoTrack];
      
      // If system audio was granted, add it
      if (displayStream.getAudioTracks().length > 0) {
        finalStreamTracks.push(displayStream.getAudioTracks()[0]);
      }

      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const audioTrack = audioStream.getAudioTracks()[0];
          finalStreamTracks.push(audioTrack);
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

      const finalStream = new MediaStream(finalStreamTracks);
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

  const handleTakeScreenshot = async () => {
     try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];

      const imageCapture = new ImageCapture(videoTrack);
      const bitmap = await imageCapture.grabFrame();
      
      videoTrack.stop(); // Stop the stream immediately after capture

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(bitmap, 0, 0);
        const url = canvas.toDataURL('image/png');
        setScreenshotUrl(url);
        setIsTakingScreenshot(true);
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        toast({
          title: 'Permission Denied',
          description: 'Screen sharing permission is required to take a screenshot.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error Taking Screenshot',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleScreenshotComplete = async (blob: Blob | null) => {
    setIsTakingScreenshot(false);
    setScreenshotUrl(null);
    if (blob && user) {
        const timestamp = new Date();
        const filename = `ScreenSnapp-${timestamp.toISOString()}.png`;
        await db.recordings.add({
            userId: user.id,
            type: 'screenshot',
            blob,
            filename,
            timestamp,
            tags: [],
            description: '',
        });
    }
  };
  
  useEffect(() => {
    return () => {
      cleanup();
    }
  }, []);

  return (
    <>
      {isTakingScreenshot && screenshotUrl && (
        <ScreenshotOverlay
          imageUrl={screenshotUrl}
          onComplete={handleScreenshotComplete}
        />
      )}
      <div className="flex flex-col items-center justify-center gap-6 rounded-xl border p-6 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-center tracking-tight">
            Capture Your Screen Instantly
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
              <>
                <Button size="lg" className="flex-1 text-base" onClick={handleStartRecording}>
                  <Video className="mr-2" /> Record Screen
                </Button>
                <Button size="lg" className="flex-1 text-base" variant="outline" onClick={handleTakeScreenshot}>
                  <Camera className="mr-2" /> Take Screenshot
                </Button>
              </>
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
    </>
  );
}
