import { Token } from "../domain/model/token";
import { TokenRepository } from "../domain/repository/token.repository";

export class TokenService {
  constructor(private readonly tokenRepository: TokenRepository) {}

  // 특정 체인의 특정 토큰 조회
  async getTokenByChainIdAddress(
    chainId: number,
    address: string,
  ): Promise<Token | null> {
    return this.tokenRepository.findByChainIdAndAddress(chainId, address);
  }

  // 특정 체인의 토큰 목록 조회
  async getTokensByChainId(chainId: number): Promise<Token[]> {
    return this.tokenRepository.findTokenByChainId(chainId);
  }

  // 토큰 1개 저장
  async saveToken(token: Token): Promise<void> {
    const exists = await this.tokenRepository.existsByChainIdAndAddress(
      token.chainId,
      token.tokenAddress,
    );
    if (exists) return;
    await this.tokenRepository.saveToken(token);
  }

  // 토큰 여러 개 저장
  async saveTokens(tokens: Token[]): Promise<void> {
    if (tokens.length === 0) return;
    const newTokens: Token[] = [];

    for (const token of tokens) {
      const exists = await this.tokenRepository.existsByChainIdAndAddress(
        token.chainId,
        token.tokenAddress,
      );
      if (!exists) newTokens.push(token);
    }

    if (newTokens.length === 0) return;
    await this.tokenRepository.saveTokens(newTokens);
  }
}
