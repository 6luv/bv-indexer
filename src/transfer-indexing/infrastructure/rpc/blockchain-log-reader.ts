import { Inject, Injectable } from "@nestjs/common";
import { Log } from "@/transfer-indexing/domain/model/log";
import { LogReader } from "@/transfer-indexing/domain/protocol/log-reader.protocol";
import {
  BLOCKCHAIN_CLIENT,
  BlockchainClient,
} from "@/shared/domain/protocol/blockchain-client.protocol";

@Injectable()
export class BlockchainLogReader implements LogReader {
  constructor(
    @Inject(BLOCKCHAIN_CLIENT)
    private readonly blockchainClient: BlockchainClient,
  ) {}

  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    return this.blockchainClient.getLogsByBlockNumber(blockNumber);
  }

  async getLogsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Log[]> {
    return this.blockchainClient.getLogsInBlockRange(fromBlock, toBlock);
  }
}
