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

  const handleStartRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: includeAudio, // System audio
      });

      let finalStream: MediaStream;

      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          const combinedStream = new MediaStream([...displayStream.getTracks(), audioTrack]);
          // Handle case where user stops sharing from browser controls
          combinedStream.getVideoTracks()[0].addEventListener('ended', handleStopRecording);
          finalStream = combinedStream;
        } catch (audioError) {
          console.warn("Could not get microphone audio, continuing with system audio only.", audioError);
          finalStream = displayStream;
           // Handle case where user stops sharing from browser controls
          finalStream.getVideoTracks()[0].addEventListener('ended', handleStopRecording);
          toast({
            title: 'Microphone not found',
            description: 'Recording will continue without microphone audio.',
            variant: 'destructive'
          });
        }
      } else {
        finalStream = displayStream;
         // Handle case where user stops sharing from browser controls
        finalStream.getVideoTracks()[0].addEventListener('ended', handleStopRecording);
      }
      
      mediaStream.current = finalStream;
      
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
      if (error.name !== 'NotAllowedError') {
        toast({
          title: 'Error starting recording',
          description: error.message || 'Please ensure you have granted permissions.',
          variant: 'destructive',
        });
      }
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
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track found for screenshot.');
      }

      // A small delay to allow the user to switch to the window they want to capture
      setTimeout(async () => {
        try {
          // ImageCapture is more reliable for grabbing a single frame
          const imageCapture = new ImageCapture(videoTrack);
          const bitmap = await imageCapture.grabFrame();
          
          // Use a canvas to convert the bitmap to a Blob
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
              // Important: stop the stream tracks once done
              stream.getTracks().forEach((track) => track.stop());
            }, 'image/png');
          } else {
             // Stop stream even if canvas context fails
             stream.getTracks().forEach((track) => track.stop());
          }
        } catch (captureError) {
           console.error('Error capturing frame:', captureError);
           // Stop stream on capture error
           stream.getTracks().forEach((track) => track.stop());
           toast({
              title: 'Error capturing screenshot',
              description: 'Could not capture the image from the screen.',
              variant: 'destructive',
           });
        }
      }, 200); // 200ms delay

    } catch (err) {
      console.error('Error taking screenshot:', err);
      const error = err as Error;
      // Don't show a toast if the user just cancels the screen selection dialog
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's'){
        e.preventDefault();
        if (!isRecording) {
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
      // Ensure cleanup runs when the component unmounts
      cleanup();
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
          Record videos or take screenshots with a single click. Your captures appear below.
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
    </>
  );
}
