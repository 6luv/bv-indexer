import { publicClient } from "@/shared/viem/public-client";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransactionReader } from "@/transfer-indexing/domain/protocol/transaction-reader.protocol";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ViemTransactionReader implements TransactionReader {
  async getTransactionsByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    const block = await publicClient.getBlock({
      blockNumber,
      includeTransactions: true,
    });
    console.log("[TransactionRpcClient] blockNumber: ", block.number);
    console.log("[TransactionRpcClient] tx count: ", block.transactions.length);
    console.log("[TransactionRpcClient] first tx: ", block.transactions[0]);

    const transactions = Array.isArray(block.transactions)
      ? block.transactions
      : [];

    return transactions.map((tx) =>
      Transaction.create(
        tx.hash,
        tx.from,
        tx.to?.toString() ?? "",
        tx.value,
        tx.blockHash,
        block.number,
        Number(block.timestamp),
      ),
    );
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

  async getTransactionsByHashes(txHashes: string[]): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (const txHash of txHashes) {
      const tx = await publicClient.getTransaction({
        hash: txHash as `0x${string}`,
      });
      const block = await publicClient.getBlock({
        blockHash: tx.blockHash as `0x${string}`,
      });

      transactions.push(
        Transaction.create(
          tx.hash,
          tx.from,
          tx.to?.toString() ?? "",
          tx.value,
          tx.blockHash,
          block.number,
          Number(block.timestamp),
        ),
      );
    }

    return transactions;
  }
}
