import { Transaction } from "../domain/model/transaction";

export interface TransactionRpcPort {
  getTransactionsByBlockNumber(blockNumber: bigint): Promise<Transaction[]>;
  getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]>;
}
