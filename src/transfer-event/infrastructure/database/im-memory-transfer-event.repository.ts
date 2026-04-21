import { TransferEvent } from "@/transfer-event/domain/model/transfer-event";
import { TransferEventRepository } from "@/transfer-event/domain/repository/transfer-event.repository";

export class InMemoryTransferEventRepository implements TransferEventRepository {
  private readonly transferEvents = new Map<string, TransferEvent>();

  private createKey(transactionHash: string, logIndex: number): string {
    return `${transactionHash}-${logIndex}`;
  }

  async saveTransferEvent(transferEvent: TransferEvent): Promise<void> {
    const key = this.createKey(
      transferEvent.transactionHash,
      transferEvent.logIndex,
    );

    if (this.transferEvents.has(key)) return;
    this.transferEvents.set(key, transferEvent);
  }

  async saveTransferEvents(transferEvents: TransferEvent[]): Promise<void> {
    for (const transferEvent of transferEvents) {
      const key = this.createKey(
        transferEvent.transactionHash,
        transferEvent.logIndex,
      );
      if (this.transferEvents.has(key)) continue;

      this.transferEvents.set(key, transferEvent);
    }
  }

  async existsByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<boolean> {
    const key = this.createKey(transactionHash, logIndex);
    return this.transferEvents.has(key);
  }
}
