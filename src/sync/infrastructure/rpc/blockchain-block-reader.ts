import { Inject, Injectable } from "@nestjs/common";
import { BlockReader } from "@/sync/domain/protocol/block-reader.protocol";
import {
  BLOCKCHAIN_CLIENT,
  BlockchainClient,
} from "@/shared/domain/protocol/blockchain-client.protocol";

@Injectable()
export class BlockchainBlockReader implements BlockReader {
  constructor(
    @Inject(BLOCKCHAIN_CLIENT)
    private readonly blockchainClient: BlockchainClient,
  ) {}

  async getLatestBlockNumber(): Promise<bigint> {
    return this.blockchainClient.getLatestBlockNumber();
  }
}
