
'use client';

import { useState, useRef, MouseEvent } from 'react';
import { Button } from './ui/button';
import { Crop, X, MousePointer } from 'lucide-react';
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

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCropEnd(null); // Reset end point on new drag
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (cropStart && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseUp = () => {
    // Crop is set, user can now confirm or reset
  };
  
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

    if (width < 1 || height < 1) return null;

    return { x, y, width, height };
  };

  const handleConfirm = async () => {
    const cropArea = getCropArea();
    if (cropArea) {
      try {
        const croppedImageBlob = await getCroppedImg(imageUrl, cropArea);
        onComplete(croppedImageBlob);
      } catch (error) {
         console.error("Error cropping image:", error);
         onComplete(null);
      }
    } else {
        // If no crop area is selected, maybe save the whole image or show an error
        // For now, we'll treat it as a cancellation.
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
                    Click and drag on the image to select the area you want to capture.
                 </AlertDescription>
            </Alert>
            <div className="flex items-center gap-4">
                <Button onClick={handleConfirm} size="lg" disabled={!cropStart || !cropEnd}>
                    <Crop className="mr-2" />
                    Confirm Crop
                </Button>
                <Button onClick={handleCancel} variant="outline" size="lg">
                    <X className="mr-2" />
                    Cancel
                </Button>
            </div>
       </div>
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div
          className="relative cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img ref={imageRef} src={imageUrl} alt="Screen capture" className="max-w-full max-h-full" />
          {renderCropBox()}
        </div>
      </div>
    </div>
  );
}
