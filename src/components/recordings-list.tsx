'use client';

import type { Recording } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Monitor, Camera, Trash2, Tags, Sparkles, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Textarea } from './ui/textarea';
import { generateTagsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type RecordingsListProps = {
  recordings: Recording[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Recording>) => void;
};

function TagGenerator({ recording, onUpdate }: { recording: Recording, onUpdate: (id: string, updates: Partial<Recording>) => void; }) {
  const [description, setDescription] = useState(recording.description);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateTags = () => {
    if (!description.trim()) {
      toast({
        title: 'Description is empty',
        description: 'Please describe the recording content to generate tags.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
        onUpdate(recording.id, { description });
        const result = await generateTagsAction({ description });
        if(result.success && result.tags) {
            onUpdate(recording.id, { tags: Array.from(new Set([...recording.tags, ...result.tags])) });
            toast({
                title: 'Tags generated!',
                description: 'New smart tags have been added.',
            });
        } else {
            toast({
                title: 'Error generating tags',
                description: result.error,
                variant: 'destructive',
            });
        }
    });
  };

  return (
      <div className="mt-4 space-y-2">
          <Textarea 
              placeholder="Add a description of the recording to generate smart tags..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
              rows={3}
          />
          <Button onClick={handleGenerateTags} disabled={isPending} size="sm" variant="outline" className="w-full sm:w-auto">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Smart Tags
          </Button>
      </div>
  )
}

function RecordingCard({ recording, onDelete, onUpdate }: { recording: Recording; onDelete: (id: string) => void; onUpdate: (id: string, updates: Partial<Recording>) => void; }) {
  const [showTagGenerator, setShowTagGenerator] = useState(false);

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
        <Button variant="ghost" size="sm" onClick={() => setShowTagGenerator(!showTagGenerator)}>
          <Tags className="mr-2 h-4 w-4"/> Tags / Notes
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={recording.url} download={recording.filename}>
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(recording.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
      {showTagGenerator && (
        <div className="p-4 border-t">
          <TagGenerator recording={recording} onUpdate={onUpdate} />
        </div>
      )}
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
       <div className="pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Your Captures</h2>
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
