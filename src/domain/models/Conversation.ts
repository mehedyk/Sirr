import { IConversation, ConversationType } from '@/types';

export class Conversation implements IConversation {
  public id: string;
  public type: ConversationType;
  public name?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: IConversation) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public updateName(newName: string): void {
    this.name = newName;
    this.updatedAt = new Date();
  }

  public isGroup(): boolean {
    return this.type === 'group';
  }

  public isDirect(): boolean {
    return this.type === 'direct';
  }

  public toJSON(): IConversation {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
