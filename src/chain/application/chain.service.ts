import { Chain } from "../domain/model/chain";
import { ChainRepository } from "../domain/repository/chein.repository";

export class ChainService {
  constructor(private readonly chainRepository: ChainRepository) {}

  // 체인 1개 조회
  async getChain(chainId: number): Promise<Chain | null> {
    return this.chainRepository.findByChainId(chainId);
  }

  // 체인 1개 저장
  async saveChain(chain: Chain): Promise<void> {
    const exists = await this.chainRepository.existsBychainId(chain.chainId);
    if (exists) return;
    await this.chainRepository.saveChain(chain);
  }

  // 체인 1개 삭제
  async deleteChain(chainId: number): Promise<void> {
    const exists = await this.chainRepository.existsBychainId(chainId);
    if (!exists) return;
    await this.chainRepository.deleteChain(chainId);
  }
}
