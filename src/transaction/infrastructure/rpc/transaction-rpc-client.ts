import { Transaction } from "@/transaction/domain/model/transaction";

export class TransactionRpcClient implements TransactionRpcClient {
  async getTransactionsByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    return [
      new Transaction({
        hash: "0x" + "1".repeat(64),
        from: "0x" + "1".repeat(64),
        to: "0x" + "1".repeat(64),
        value: 10n,
        blockHash: "0x" + "1".repeat(64),
        blockNumber,
        blockTimestamp: Date.now(),
      }),
    ];
  }

  async getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (let i = fromBlock; i <= toBlock; i++) {
      const blockTransactions = await this.getTransactionsByBlockNumber(i);
      transactions.push(...blockTransactions);
    }

    return transactions;
  }
}
