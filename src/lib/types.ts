export type Recording = {
  id: string;
  type: 'video' | 'screenshot';
  blob: Blob;
  url: string;
  filename: string;
  timestamp: Date;
  tags: string[];
  description: string;
};
