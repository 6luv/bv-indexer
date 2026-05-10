import { Inject, Injectable } from "@nestjs/common";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransactionReader } from "@/transfer-indexing/domain/protocol/transaction-reader.protocol";
import {
  BLOCKCHAIN_CLIENT,
  BlockchainClient,
} from "@/shared/domain/protocol/blockchain-client.protocol";

@Injectable()
export class BlockchainTransactionReader implements TransactionReader {
  constructor(
    @Inject(BLOCKCHAIN_CLIENT)
    private readonly blockchainClient: BlockchainClient,
  ) {}

  async getTransactionsByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    return this.blockchainClient.getTransactionsByBlockNumber(blockNumber);
  }

  async getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]> {
    return this.blockchainClient.getTransactionsInBlockRange(
      fromBlock,
      toBlock,
    );
  }

  async getTransactionsByHashes(txHashes: string[]): Promise<Transaction[]> {
    return this.blockchainClient.getTransactionsByHashes(txHashes);
  }
}
