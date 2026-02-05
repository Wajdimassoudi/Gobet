
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  username: string;
  role: Role;
  balance: number;
  createdAt: string;
}

export interface Game {
  id: string;
  name: string;
  provider: string;
  category: 'Slots' | 'Live Casino' | 'Casino';
  imageUrl: string;
}

export interface Market {
  name: string;
  odds: {
    name: string;
    value: number;
  }[];
}

export interface SportEvent {
  id: string;
  name: string;
  participants: [string, string];
  startTime: string;
  live: boolean;
  markets: Market[];
}
