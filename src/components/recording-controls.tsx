'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Pause, Play, Square, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

type RecordingControlsProps = {
  onRecordingComplete: (blob: Blob) => void;
  onScreenshot: (blob: Blob) => void;
};

export function RecordingControls({
  onRecordingComplete,
  onScreenshot,
}: RecordingControlsProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [includeAudio, setIncludeAudio] = useState(true);

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
        audio: includeAudio,
      });

      displayStream.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };
      
      let finalStream: MediaStream = displayStream;

      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          finalStream.addTrack(audioTrack);
        } catch (audioError) {
          console.warn('Could not get microphone audio.', audioError);
          toast({
            title: 'Microphone not found',
            description: 'Recording will continue without microphone audio.',
            variant: 'default',
          });
        }
      }

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
      console.error('Error starting recording:', err);
      const error = err as Error;
      if (error.name !== 'NotAllowedError') {
        toast({
          title: 'Error starting recording',
          description: error.message || 'Please ensure you have granted screen permissions.',
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

  const handleScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];

        try {
          const imageCapture = new ImageCapture(videoTrack);
          const bitmap = await imageCapture.grabFrame();
          
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(bitmap, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                onScreenshot(blob);
              }
              stream.getTracks().forEach((track) => track.stop());
            }, 'image/png');
          } else {
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (captureError) {
           console.error('Error capturing frame:', captureError);
           stream.getTracks().forEach((track) => track.stop());
           toast({
              title: 'Error capturing screenshot',
              description: 'Could not capture the image from the screen.',
              variant: 'destructive',
           });
        }
    } catch (err) {
      console.error('Error taking screenshot:', err);
      const error = err as Error;
      if (error.name !== 'NotAllowedError') {
        toast({
          title: 'Error starting screenshot session',
          description: error.message || 'Please ensure you have granted screen permissions.',
          variant: 'destructive',
        });
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
              <Button size="lg" className="flex-1 text-base" variant="outline" onClick={handleScreenshot}>
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
  );
}
