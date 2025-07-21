'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Pause, Play, Square, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

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

  const handleStartRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: includeAudio,
      });

      let finalStream: MediaStream;

      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          finalStream = new MediaStream([...displayStream.getTracks(), audioTrack]);
        } catch (audioError) {
          console.warn("Could not get microphone audio, continuing with system audio only.", audioError);
          finalStream = displayStream;
          toast({
            title: 'Microphone not found',
            description: 'Recording will continue without microphone audio.',
            variant: 'destructive'
          });
        }
      } else {
        finalStream = displayStream;
      }
      
      mediaStream.current = finalStream;
      mediaStream.current.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };

      mediaRecorder.current = new MediaRecorder(mediaStream.current, {
        mimeType: 'video/webm; codecs=vp9',
      });

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
      toast({
        title: 'Error starting recording',
        description: error.message || 'Please ensure you have granted permissions.',
        variant: 'destructive',
      });
      cleanup();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    } else {
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
      // For a simple screenshot, we don't need to maintain the stream if not recording.
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track found for screenshot.');
      }

      // Use a brief delay to allow the user to switch to the desired window
      // after granting permission, as the permission dialog itself might be captured.
      setTimeout(async () => {
        try {
          const imageCapture = new ImageCapture(videoTrack);
          const bitmap = await imageCapture.grabFrame();
          
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if(context) {
            context.drawImage(bitmap, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                onScreenshot(blob);
                toast({
                  title: 'Screenshot captured!',
                  description: 'It has been added to your list below.',
                });
              }
              // Stop the tracks immediately after capture
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
      }, 200);

    } catch (err) {
      console.error('Error taking screenshot:', err);
      const error = err as Error;
      toast({
        title: 'Error starting screenshot session',
        description: error.message || 'Please ensure you have granted screen permissions.',
        variant: 'destructive',
      });
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's'){
        e.preventDefault();
        if (!isRecording) { // Only allow screenshot if not already recording
          handleScreenshot();
        }
      }
      if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r'){
        e.preventDefault();
        if(isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cleanup(); // Cleanup on component unmount
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);


  return (
    <>
      <div className="flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center tracking-tight">
          Capture Your Screen Instantly
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          Record videos or take screenshots with a single click. High-quality, fast, and all in your browser.
        </p>
        <div className="flex items-center space-x-2 my-4">
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
        <div className="text-xs text-muted-foreground flex items-center gap-4">
          <span>Shortcut: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> to Record/Stop</span>
          <span><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> to Screenshot</span>
        </div>
      </div>
      <Separator className="my-8" />
    </>
  );
}
