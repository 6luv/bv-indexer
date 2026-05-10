import { Transaction } from "@/transfer-indexing/domain/model/transaction";

export const TRANSACTION_READER = Symbol("TRANSACTION_READER");

export interface TransactionReader {
  getTransactionsByBlockNumber(blockNumber: bigint): Promise<Transaction[]>;
  getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]>;
  getTransactionsByHashes(txHashes: string[]): Promise<Transaction[]>;
}
