import { Injectable } from "@nestjs/common";
import { Transaction } from "../domain/model/transaction";
import { TransferEvent } from "../domain/model/transfer-event";
import { TransactionRepository } from "../domain/repository/transaction.repository";
import { TransferEventRepository } from "../domain/repository/transfer-event.repository";

@Injectable()
export class TransferEventSaveService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly transferEventRepository: TransferEventRepository,
  ) {}

  // 저장되지 않은 트랜잭션만 저장한다.
  async saveNewTransactions(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      const exists = await this.transactionRepository.existsByHash(
        transaction.getHash(),
      );

      if (!exists) {
        await this.transactionRepository.saveTransaction(transaction);
      }
    }
  }

  // 저장되지 않은 Transfer 이벤트만 저장한다.
  async saveNewTransferEvents(transferEvents: TransferEvent[]): Promise<void> {
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
