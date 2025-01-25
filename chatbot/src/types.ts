export type Message = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export type CDP = 'Segment' | 'mParticle' | 'Lytics' | 'Zeotap';

export const CDPs: CDP[] = ['Segment', 'mParticle', 'Lytics', 'Zeotap'];