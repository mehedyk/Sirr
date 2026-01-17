import { useCallback } from 'react';
import { EncryptionService } from '@/services/EncryptionService';
import { KeyManager } from '@/services/KeyManager';

export function useEncryption() {
  const encryptionService = new EncryptionService();
  const keyManager = KeyManager.getInstance();

  const encrypt = useCallback(async (data: string, conversationId: string): Promise<{ encrypted: string; iv: string }> => {
    let key = keyManager.getConversationKey(conversationId);
    if (!key) {
      key = await keyManager.generateConversationKey(conversationId);
    }
    return encryptionService.encrypt(data, key);
  }, []);

  const decrypt = useCallback(async (encrypted: string, iv: string, conversationId: string): Promise<string> => {
    const key = keyManager.getConversationKey(conversationId);
    if (!key) {
      throw new Error('Conversation key not found');
    }
    return encryptionService.decrypt(encrypted, iv, key);
  }, []);

  return {
    encrypt,
    decrypt,
  };
}
