import { Token } from "@/token/domain/model/token";
import { TokenRepository } from "@/token/domain/repository/token.repository";

export class InMemoryTokenRepository implements TokenRepository {
  private readonly tokens = new Map<string, Token>();

  private createKey(chainId: number, address: string): string {
    return `${chainId}-${address.toLocaleLowerCase()}`;
  }

  async saveToken(token: Token): Promise<void> {
    const key = this.createKey(token.chainId, token.tokenAddress);
    if (this.tokens.has(key)) return;
    this.tokens.set(key, token);
  }

  async saveTokens(tokens: Token[]): Promise<void> {
    if (tokens.length === 0) return;

    for (const token of tokens) {
      const key = this.createKey(token.chainId, token.tokenAddress);
      if (this.tokens.has(key)) return;
      this.tokens.set(key, token);
    }
  }

  async findByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<Token | null> {
    const key = this.createKey(chainId, address);
    return this.tokens.get(key) ?? null;
  }

  async findTokenByChainId(chainId: number): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(
      (token) => token.chainId === chainId,
    );
  }

  async existsByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<boolean> {
    const key = this.createKey(chainId, address);
    return this.tokens.has(key);
  }
}
