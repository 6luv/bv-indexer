import { Token } from "../model/token";

export interface TokenRepository {
  saveToken(token: Token): Promise<void>;
  saveTokens(tokens: Token[]): Promise<void>;
  findByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<Token | null>;
  findTokenByChainId(chainId: number): Promise<Token[]>;
  existsByChainIdAndAddress(chainId: number, address: string): Promise<boolean>;
}
