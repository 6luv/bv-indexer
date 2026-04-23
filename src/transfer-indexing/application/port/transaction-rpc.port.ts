import { Transaction } from "@/transfer-indexing/domain/model/transaction";

export interface TransactionRpcPort {
  getTransactionsByBlockNumber(blockNumber: bigint): Promise<Transaction[]>;
  getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]>;
  getTransactionsByHashes(txHashes: string[]): Promise<Transaction[]>;
}
