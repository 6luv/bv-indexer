import { Transaction } from "../model/transaction";

export const TRANSACTION_REPOSITORY = Symbol("TRANSACTION_REPOSITORY");

export interface TransactionRepository {
  saveTransaction(transaction: Transaction): Promise<void>;
  saveTransactions(transactions: Transaction[]): Promise<void>;
  findTransactionByHash(transactionHash: string): Promise<Transaction | null>;
  findTransactionByBlockNumber(blockNumber: bigint): Promise<Transaction[]>;
  existsByHash(transactionHash: string): Promise<boolean>;
  count(): Promise<number>;
}
