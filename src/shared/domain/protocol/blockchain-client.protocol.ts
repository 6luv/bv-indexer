import { Log } from "@/transfer-indexing/domain/model/log";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";

export const BLOCKCHAIN_CLIENT = Symbol("BLOCKCHAIN_CLIENT");

export interface BlockchainClient {
  getLatestBlockNumber(): Promise<bigint>;
  getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]>;
  getLogsInBlockRange(fromBlock: bigint, toBlock: bigint): Promise<Log[]>;
  getTransactionsByBlockNumber(blockNumber: bigint): Promise<Transaction[]>;
  getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]>;
  getTransactionsByHashes(txHashes: string[]): Promise<Transaction[]>;
}
