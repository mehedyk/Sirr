import { Conversation } from '@/domain/models/Conversation';
import { User } from '@/domain/models/User';
import { SupabaseAdapter } from './SupabaseAdapter';
import { KeyManager } from './KeyManager';

export class GroupService {
  private supabaseAdapter: SupabaseAdapter;
  private keyManager: KeyManager;

  constructor(supabaseAdapter: SupabaseAdapter) {
    this.supabaseAdapter = supabaseAdapter;
    this.keyManager = KeyManager.getInstance();
  }

  public async createGroup(name: string, userId: string): Promise<Conversation> {
    const conversation = await this.supabaseAdapter.createConversation('group', name);
    
    // Add creator as admin member
    await this.addMember(conversation.id, userId, 'admin');
    
    // Generate group key
    await this.keyManager.generateConversationKey(conversation.id);
    
    return conversation;
  }

  public async addMember(
    conversationId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<void> {
    const { error } = await this.supabaseAdapter.getClient()
      .from('conversation_members')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Share group key with new member
    const groupKey = this.keyManager.getConversationKey(conversationId);
    if (groupKey) {
      // In a real implementation, encrypt the group key with the user's public key
      // For now, we'll just ensure the key exists
      await this.keyManager.setConversationKey(conversationId, groupKey);
    }
  }

  public async removeMember(conversationId: string, userId: string): Promise<void> {
    const { error } = await this.supabaseAdapter.getClient()
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  public async getGroupMembers(conversationId: string): Promise<User[]> {
    const { data, error } = await this.supabaseAdapter.getClient()
      .from('conversation_members')
      .select('user_id, users(*)')
      .eq('conversation_id', conversationId);

    if (error) throw error;

    return (data || []).map((member: any) => {
      const userData = member.users;
      return new User({
        id: userData.id,
        username: userData.username,
        publicKey: userData.public_key || undefined,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      });
    });
  }

  public async getUserGroups(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabaseAdapter.getClient()
      .from('conversation_members')
      .select('conversation_id, conversations(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || [])
      .filter((item: any) => item.conversations?.type === 'group')
      .map((item: any) => {
        const conv = item.conversations;
        return new Conversation({
          id: conv.id,
          type: conv.type,
          name: conv.name || undefined,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
        });
      });
  }
}