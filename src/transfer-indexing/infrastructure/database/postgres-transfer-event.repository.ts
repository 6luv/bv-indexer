import { prisma } from "@/shared/database/prisma-client";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";
import { TransferEventRepository } from "@/transfer-indexing/domain/repository/transfer-event.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PostgresTransferEventRepository implements TransferEventRepository {
  async saveTransferEvent(transferEvent: TransferEvent): Promise<void> {
    await prisma.transferEvent.upsert({
      where: {
        transactionHash_logIndex: {
          transactionHash: transferEvent.getTransactionHash(),
          logIndex: transferEvent.getLogIndex(),
        },
      },
      update: {},
      create: {
        tokenAddress: transferEvent.getTokenAddress(),
        fromAddress: transferEvent.getFrom(),
        toAddress: transferEvent.getTo(),
        value: transferEvent.getValue(),
        blockNumber: transferEvent.getBlockNumber(),
        blockTimestamp: transferEvent.getBlockTimestamp(),
        transactionHash: transferEvent.getTransactionHash(),
        logIndex: transferEvent.getLogIndex(),
      },
    });
  }

  async saveTransferEvents(transferEvents: TransferEvent[]): Promise<void> {
    for (const transferEvent of transferEvents) {
      await this.saveTransferEvent(transferEvent);
    }
  }

  async existsByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<boolean> {
    const row = await prisma.transferEvent.findUnique({
      where: {
        transactionHash_logIndex: {
          transactionHash,
          logIndex,
        },
      },
      select: { id: true },
    });
    return !!row;
  }

  async count(): Promise<number> {
    return prisma.transferEvent.count();
  }
}
