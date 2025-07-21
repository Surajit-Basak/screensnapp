'use client';

import type { Recording } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Monitor, Camera, Trash2 } from 'lucide-react';

type RecordingsListProps = {
  recordings: Recording[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Recording>) => void;
};

function RecordingCard({ recording, onDelete }: { recording: Recording; onDelete: (id: string) => void; onUpdate: (id: string, updates: Partial<Recording>) => void; }) {

  return (
    <Card className="overflow-hidden shadow-md transition-all hover:shadow-xl">
      <CardContent className="p-0">
        {recording.type === 'video' ? (
          <video src={recording.url} controls className="aspect-video w-full bg-muted" />
        ) : (
          <img src={recording.url} alt={recording.filename} className="aspect-video w-full object-cover bg-muted" data-ai-hint="user interface" />
        )}
      </CardContent>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base font-medium truncate">
          {recording.type === 'video' ? (
            <Monitor className="h-5 w-5 shrink-0 text-primary" />
          ) : (
            <Camera className="h-5 w-5 shrink-0 text-primary" />
          )}
          <span className="truncate">{recording.filename}</span>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {recording.timestamp.toLocaleString()}
        </div>
        {recording.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
                {recording.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
        )}
      </CardHeader>
      <CardFooter className="bg-muted/50 p-4 flex flex-col sm:flex-row gap-2 justify-end">
        <Button variant="outline" size="sm" asChild>
          <a href={recording.url} download={recording.filename}>
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(recording.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export function RecordingsList({ recordings, onDelete, onUpdate }: RecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <div className="container max-w-screen-lg py-16 text-center">
        <Monitor className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No Recordings Yet</h2>
        <p className="mt-2 text-muted-foreground">
          Your screen recordings and screenshots will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-lg py-8">
       <div className="pb-4 border-b mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Your Captures</h2>
            <p className="text-muted-foreground">Here are your recent recordings and screenshots.</p>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recordings.map((rec) => (
          <RecordingCard key={rec.id} recording={rec} onDelete={onDelete} onUpdate={onUpdate}/>
        ))}
      </div>
    </div>
  );
}
