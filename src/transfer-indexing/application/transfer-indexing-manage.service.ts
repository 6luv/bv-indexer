import { TransactionRepository } from "../domain/repository/transaction.repository";
import { TransferEventRepository } from "../domain/repository/transfer-event.repository";
import { TransferEventDecoder } from "./decoder/transfer-event.decoder";
import { IndexedTransferResult } from "./types/indexed-transfer-result";
import { TransferEvent } from "../domain/model/transfer-event";
import { Log } from "../domain/model/log";
import { Transaction } from "../domain/model/transaction";
import { LogRpcPort } from "./port/log-rpc.port";
import { TransactionRpcPort } from "./port/transaction-rpc.port";
import { Injectable } from "@nestjs/common";

// 블록 하나의 로그를 조회해서 transfer 인덱싱 실행
@Injectable()
export class BlockTransferService {
  constructor(
    private readonly logRpcPort: LogRpcPort,
    private readonly logTransferService: LogTransferService,
  ) {}

  async execute(blockNumber: bigint): Promise<IndexedTransferResult> {
    const logs = await this.logRpcPort.getLogsByBlockNumber(blockNumber);
    return this.logTransferService.execute(logs);
  }
}

@Injectable()
export class BlockRangeTransferService {
  constructor(
    private readonly logRpcPort: LogRpcPort,
    private readonly logTransferService: LogTransferService,
  ) {}

  async execute(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<IndexedTransferResult> {
    if (fromBlock > toBlock) {
      throw new Error("fromBlock must be less than or equal to toBlock");
    }

    const logs = await this.logRpcPort.getLogsInBlockRange(fromBlock, toBlock);
    return this.logTransferService.execute(logs);
  }
}

@Injectable()
export class LogTransferService {
  constructor(
    private readonly transferEventDecoder: TransferEventDecoder,
    private readonly transactionRpcPort: TransactionRpcPort,
    private readonly transactionRepository: TransactionRepository,
    private readonly transferEventRepository: TransferEventRepository,
    private readonly targetWalletAddress: string,
  ) {}

  async execute(logs: Log[]): Promise<IndexedTransferResult> {
    const transferEvents = await this.decodeTransferEvents(logs);
    const indexedTransferEvents = this.filterByTargetWallet(transferEvents);
    const txHashes = this.getUniqueTransactionHashes(indexedTransferEvents);

    const transactions =
      await this.transactionRpcPort.getTransactionsByHashes(txHashes);

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
