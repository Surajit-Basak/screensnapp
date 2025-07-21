
'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Button } from './ui/button';
import { Crop, X } from 'lucide-react';
import { getCroppedImg } from '@/lib/crop-image';

interface ScreenshotOverlayProps {
  imageUrl: string;
  onComplete: (blob: Blob | null) => void;
}

export function ScreenshotOverlay({ imageUrl, onComplete }: ScreenshotOverlayProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (croppedAreaPixels) {
      const croppedImageBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      onComplete(croppedImageBlob);
    } else {
        onComplete(null);
    }
  };

  const handleCancel = () => {
    onComplete(null);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={0} // Free aspect ratio
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
          cropShape="rect"
        />
      </div>
      <div className="flex justify-center items-center gap-4 p-4 bg-background border-t">
        <Button onClick={handleConfirm} size="lg">
          <Crop className="mr-2" />
          Confirm Crop
        </Button>
        <Button onClick={handleCancel} variant="outline" size="lg">
          <X className="mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

