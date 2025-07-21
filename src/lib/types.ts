export type Recording = {
  id: number;
  userId: string;
  type: 'video' | 'screenshot';
  blob: Blob;
  filename: string;
  timestamp: Date;
  tags: string[];
  description: string;
};
