import { Transaction } from "../domain/model/transaction";

export interface TransactionRpcPort {
  getTransactionByBlockNumber(blockNumber: bigint): Promise<Transaction[]>;
  getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]>;
}
