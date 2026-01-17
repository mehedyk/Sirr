export interface IEncryptable {
  encrypt(key: CryptoKey): Promise<string>;
  decrypt(key: CryptoKey): Promise<string>;
}
