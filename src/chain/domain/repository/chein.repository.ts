import { Chain } from "../model/chain";

export interface ChainRepository {
  saveChain(chain: Chain): Promise<void>;
  deleteChain(chainId: number): Promise<void>;
  findByChainId(chainId: number): Promise<Chain | null>;
  existsBychainId(chainId: number): Promise<boolean>;
}
