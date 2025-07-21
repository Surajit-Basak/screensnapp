
'use client';

import { useState, useRef, MouseEvent, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, MousePointer, X } from 'lucide-react';
import { getCroppedImg } from '@/lib/crop-image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ScreenshotOverlayProps {
  imageUrl: string;
  onComplete: (blob: Blob | null) => void;
}

export function ScreenshotOverlay({ imageUrl, onComplete }: ScreenshotOverlayProps) {
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getCropArea = () => {
    if (!cropStart || !cropEnd || !imageRef.current) return null;

    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    const displayWidth = imageRef.current.clientWidth;
    const displayHeight = imageRef.current.clientHeight;

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    const x = Math.min(cropStart.x, cropEnd.x) * scaleX;
    const y = Math.min(cropStart.y, cropEnd.y) * scaleY;
    const width = Math.abs(cropEnd.x - cropStart.x) * scaleX;
    const height = Math.abs(cropEnd.y - cropStart.y) * scaleY;

    // Ignore tiny selections that are likely accidental clicks
    if (width < 10 || height < 10) return null;

    return { x, y, width, height };
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    setIsDragging(true);
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCropEnd({ x, y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropStart || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = async () => {
    if (!isDragging) return;
    setIsDragging(false);

    const cropArea = getCropArea();
    if (cropArea) {
      try {
        const croppedImageBlob = await getCroppedImg(imageUrl, cropArea);
        onComplete(croppedImageBlob);
      } catch (error) {
         console.error("Error cropping image:", error);
         onComplete(null);
      }
    }
  };

  const handleSaveFull = async () => {
     try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        onComplete(blob);
      } catch (error) {
         console.error("Error saving full image:", error);
         onComplete(null);
      }
  };

  const handleCancel = () => {
    onComplete(null);
  };
  
  const renderCropBox = () => {
    if (!cropStart || !cropEnd) return null;

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);

    if (width < 2 || height < 2) return null;

    return (
      <div
        className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
        style={{ left: x, top: y, width, height }}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col">
       <div className="flex-shrink-0 p-4 bg-background border-b flex justify-between items-center">
            <Alert className="max-w-lg border-0 p-0 bg-transparent">
                 <MousePointer className="h-5 w-5" />
                 <AlertTitle>Select an area</AlertTitle>
                 <AlertDescription>
                    Click and drag to capture a portion of the screen. Release to confirm.
                 </AlertDescription>
            </Alert>
            <div className="flex items-center gap-4">
                <Button onClick={handleSaveFull} variant="outline" size="lg">
                    <Download className="mr-2" />
                    Save Full Capture
                </Button>
                <Button onClick={handleCancel} variant="ghost" size="lg">
                    <X className="mr-2" />
                    Cancel
                </Button>
            </div>
       </div>
      <div 
        className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
        onMouseUp={handleMouseUp}
      >
        <div
          className="relative cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <img ref={imageRef} src={imageUrl} alt="Screen capture" className="max-w-full max-h-full" />
          {renderCropBox()}
        </div>
      </div>
    </div>
  );
}
