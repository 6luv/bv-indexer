import { prisma } from "@/shared/database/prisma-client";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransactionRepository } from "@/transfer-indexing/domain/repository/transaction.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PostgresTransactionRepository implements TransactionRepository {
  async saveTransaction(transaction: Transaction): Promise<void> {
    await prisma.transaction.upsert({
      where: { hash: transaction.getHash() },
      update: {},
      create: {
        hash: transaction.getHash(),
        fromAddress: transaction.getFrom(),
        toAddress: transaction.getTo(),
        value: transaction.getValue(),
        blockHash: transaction.getBlockHash(),
        blockNumber: transaction.getBlockNumber(),
        blockTimestamp: transaction.getBlockTimestamp(),
      },
    });
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      await this.saveTransaction(transaction);
    }
  }

  async findTransactionByHash(
    transactionHash: string,
  ): Promise<Transaction | null> {
    const row = await prisma.transaction.findUnique({
      where: { hash: transactionHash },
    });

    if (!row) return null;

    return Transaction.create(
      row.hash,
      row.fromAddress,
      row.toAddress ?? "",
      row.value,
      row.blockHash,
      row.blockNumber,
      Number(row.blockTimestamp),
    );
  }

  async findTransactionByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    const rows = await prisma.transaction.findMany({
      where: { blockNumber },
    });

    return rows.map((row: any) =>
      Transaction.create(
        row.hash,
        row.fromAddress,
        row.toAddress ?? "",
        row.value,
        row.blockHash,
        row.blockNumber,
        Number(row.blockTimestamp),
      ),
    );
  }

  async existsByHash(transactionHash: string): Promise<boolean> {
    const row = await prisma.transaction.findUnique({
      where: { hash: transactionHash },
      select: { hash: true },
    });

    return !!row;
  }

  async count(): Promise<number> {
    return prisma.transaction.count();
  }
}
