import { TransferEvent } from "../model/transfer-event";

export interface TransferEventRepository {
  saveTransferEvent(transferEvent: TransferEvent): Promise<void>;
  saveTransferEvents(transferEvents: TransferEvent[]): Promise<void>;
  existsByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<boolean>;
  count(): Promise<number>;
}
