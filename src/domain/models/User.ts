import { IUser } from '@/types';

export class User implements IUser {
  public id: string;
  public username: string;
  public publicKey?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.username = data.username;
    this.publicKey = data.publicKey;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public updateUsername(newUsername: string): void {
    this.username = newUsername;
    this.updatedAt = new Date();
  }

  public setPublicKey(key: string): void {
    this.publicKey = key;
    this.updatedAt = new Date();
  }

  public toJSON(): IUser {
    return {
      id: this.id,
      username: this.username,
      publicKey: this.publicKey,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
