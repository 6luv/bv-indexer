import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransactionRepository } from "@/transfer-indexing/domain/repository/transaction.repository";

export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly transactions = new Map<string, Transaction>();

  // 트랜잭션 1개 저장
  async saveTransaction(transaction: Transaction): Promise<void> {
    const key = transaction.getHash();
    if (this.transactions.has(key)) return;

    this.transactions.set(key, transaction);
  }

  // 트랜잭션 여러 개 저장
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      const key = transaction.getHash();
      if (this.transactions.has(key)) return;

      this.transactions.set(key, transaction);
    }
  }

  // 트랜잭션 해시로 트랜잭션 조회
  async findTransactionByHash(
    transactionHash: string,
  ): Promise<Transaction | null> {
    return this.transactions.get(transactionHash) ?? null;
  }

  // 블록 번호로 트랜잭션 목록 조회
  async findTransactionByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.getBlockNumber() === blockNumber,
    );
  }

  // 트랜잭션 해시가 이미 존재하는지 확인
  async existsByHash(transactionHash: string): Promise<boolean> {
    return this.transactions.has(transactionHash);
  }
}
