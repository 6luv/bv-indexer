import { Transaction } from "../domain/model/transaction";
import { TransactionRepository } from "../domain/repository/transaction.repository";
import { TransactionRpcPort } from "./transaction-rpc.port";

export class TransactionService {
  constructor(
    private readonly transactionRpcPort: TransactionRpcPort,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  // 특정 블록의 트랜잭션 목록 조회
  async getTransactionByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    return this.transactionRpcPort.getTransactionByBlockNumber(blockNumber);
  }

  // 특정 범위의 블록들에 포함된 트랜잭션 목록 조회
  async getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]> {
    if (fromBlock > toBlock)
      throw new Error("fromBlock must be less then or equal to toBlock");
    return this.transactionRpcPort.getTransactionsInBlockRange(
      fromBlock,
      toBlock,
    );
  }

  // 트랜잭션 1개 저장
  async saveTransaction(transaction: Transaction): Promise<void> {
    const exists = await this.transactionRepository.existsByHash(
      transaction.hash,
    );
    if (exists) return;

    await this.transactionRepository.saveTransaction(transaction);
  }

  // 트랜잭션 여러 개 저장
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;

    for (const transaction of transactions) {
      await this.saveTransaction(transaction);
    }
  }

  // 특정 트랜잭션 해시가 이미 저장되어 있는지 확인
  async exists(transactionHash: string): Promise<boolean> {
    return this.transactionRepository.existsByHash(transactionHash);
  }

  // 특정 블록 번호로 트랜잭션 목록 조회하여 저장
  async saveTransactionsByBlockNumber(blockNumber: bigint): Promise<void> {
    const transactions =
      await this.transactionRpcPort.getTransactionByBlockNumber(blockNumber);
    if (transactions.length === 0) return;

    await this.saveTransactions(transactions);
  }

  // 특정 블록 범위의 트랜잭션 목록 조회하여 저장
  async saveTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<void> {
    if (fromBlock > toBlock)
      throw new Error("fromBlock mush be less than or equal to toBlock");

    const transactions =
      await this.transactionRpcPort.getTransactionsInBlockRange(
        fromBlock,
        toBlock,
      );
    if (transactions.length === 0) return;

    await this.saveTransactions(transactions);
  }
}
