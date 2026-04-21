import { Chain } from "@/chain/domain/model/chain";
import { ChainRepository } from "@/chain/domain/repository/chein.repository";

export class InMemoryChainRepository implements ChainRepository {
  private readonly chains = new Map<number, Chain>();

  async saveChain(chain: Chain): Promise<void> {
    if (this.chains.has(chain.chainId)) return;
    this.chains.set(chain.chainId, chain);
  }

  async deleteChain(chainId: number): Promise<void> {
    if (!this.chains.has(chainId)) return;
    this.chains.delete(chainId);
  }

  async findByChainId(chainId: number): Promise<Chain | null> {
    return this.chains.get(chainId) || null;
  }

  async existsBychainId(chainId: number): Promise<boolean> {
    return this.chains.has(chainId);
  }
}
