import { Injectable } from "@nestjs/common";
import { TransferEventDecoder } from "../domain/protocol/decoder/transfer-event.decoder";
import { TransactionReader } from "../domain/protocol/transaction-reader.protocol";
import { TransactionRepository } from "../domain/repository/transaction.repository";
import { TransferEventRepository } from "../domain/repository/transfer-event.repository";
import { Log } from "../domain/model/log";
import { TransferEvent } from "../domain/model/transfer-event";
import { Transaction } from "../domain/model/transaction";

type IndexedTransferResult = {
  logCount: number;
  decodedTransferEventCount: number;
  indexedTransferEventCount: number;
  transactionCount: number;
};

@Injectable()
export class TransferEventIndexerService {
  constructor(
    private readonly transferEventDecoder: TransferEventDecoder,
    private readonly transactionReader: TransactionReader,
    private readonly transactionRepository: TransactionRepository,
    private readonly transferEventRepository: TransferEventRepository,
    private readonly targetWalletAddress: string,
  ) {}

  async execute(logs: Log[]): Promise<IndexedTransferResult> {
    const transferEvents = await this.decodeTransferEvents(logs);
    const indexedTransferEvents = this.filterByTargetWallet(transferEvents);
    const txHashes = this.getUniqueTransactionHashes(indexedTransferEvents);

    const transactions =
      await this.transactionReader.getTransactionsByHashes(txHashes);

    await this.saveTransactionsIfAbsent(transactions);
    await this.saveTransferEventsIfAbsent(indexedTransferEvents);

    return {
      logCount: logs.length,
      decodedTransferEventCount: transferEvents.length,
      indexedTransferEventCount: indexedTransferEvents.length,
      transactionCount: transactions.length,
    };
  }

  private async decodeTransferEvents(logs: Log[]): Promise<TransferEvent[]> {
    const transferEvents: TransferEvent[] = [];

    for (const log of logs) {
      const decoded = await this.transferEventDecoder.decode(log);
      if (decoded) transferEvents.push(decoded);
    }

    return transferEvents;
  }

  private filterByTargetWallet(
    transferEvents: TransferEvent[],
  ): TransferEvent[] {
    const normalizedTarget = this.targetWalletAddress.toLowerCase();

    return transferEvents.filter(
      (event) =>
        event.getFrom().toLowerCase() === normalizedTarget ||
        event.getTo().toLowerCase() === normalizedTarget,
    );
  }

  private getUniqueTransactionHashes(
    transferEvents: TransferEvent[],
  ): string[] {
    return [
      ...new Set(transferEvents.map((event) => event.getTransactionHash())),
    ];
  }

  private async saveTransactionsIfAbsent(
    transactions: Transaction[],
  ): Promise<void> {
    for (const transaction of transactions) {
      const exists = await this.transactionRepository.existsByHash(
        transaction.getHash(),
      );
      if (!exists)
        await this.transactionRepository.saveTransaction(transaction);
    }
  }

  private async saveTransferEventsIfAbsent(
    transferEvents: TransferEvent[],
  ): Promise<void> {
    for (const transferEvent of transferEvents) {
      const exists =
        await this.transferEventRepository.existsByTransactionHashAndLogIndex(
          transferEvent.getTransactionHash(),
          transferEvent.getLogIndex(),
        );

      if (!exists) {
        await this.transferEventRepository.saveTransferEvent(transferEvent);
      }
    }
  }
}
