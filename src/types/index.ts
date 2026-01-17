export type MessageType = 'text' | 'file' | 'call';
export type ConversationType = 'direct' | 'group';
export type CallStatus = 'active' | 'ended';
export type UserRole = 'admin' | 'member';
export type ThemeName = 'neo-noir' | 'digital-matrix' | 'midnight-tech' | 'tech-rust' | 'solar-shift';

export interface IEncryptable {
  encrypt(key: CryptoKey): Promise<string>;
  decrypt(key: CryptoKey): Promise<string>;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  createdAt: Date;
  expiresAt: Date;
}

export interface ITheme {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
}

export interface IUser {
  id: string;
  username: string;
  publicKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation {
  id: string;
  type: ConversationType;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
