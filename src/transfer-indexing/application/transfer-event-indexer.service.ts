import { Injectable } from "@nestjs/common";
import { TransferEventDecoder } from "../domain/protocol/decoder/transfer-event.decoder";
import { TransactionReader } from "../domain/protocol/transaction-reader.protocol";
import { Log } from "../domain/model/log";
import { TransferEvent } from "../domain/model/transfer-event";
import { TransferEventSaveService } from "./transfer-event-save.service";

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
    private readonly transferEventSaveService: TransferEventSaveService,
    private readonly targetWalletAddress: string,
  ) {}

  // 로그 목록을 Transfer 이벤트로 인덱싱한다.
  async indexFromLogs(logs: Log[]): Promise<IndexedTransferResult> {
    const transferEvents = await this.decodeTransferEvents(logs);
    const indexedTransferEvents = this.filterByTargetWallet(transferEvents);
    const txHashes = this.getUniqueTransactionHashes(indexedTransferEvents);

    const transactions =
      await this.transactionReader.getTransactionsByHashes(txHashes);

    await this.transferEventSaveService.saveNewTransactions(transactions);
    await this.transferEventSaveService.saveNewTransferEvents(
      indexedTransferEvents,
    );

    return {
      logCount: logs.length,
      decodedTransferEventCount: transferEvents.length,
      indexedTransferEventCount: indexedTransferEvents.length,
      transactionCount: transactions.length,
    };
  }

  // 로그 목록을 TransferEvent 도메인 객체 목록으로 변환한다.
  async decodeTransferEvents(logs: Log[]): Promise<TransferEvent[]> {
    const transferEvents: TransferEvent[] = [];

    for (const log of logs) {
      const decoded = await this.transferEventDecoder.decode(log);
      if (decoded) {
        transferEvents.push(decoded);
      }
    }

    return transferEvents;
  }

  // 대상 지갑 주소가 from 또는 to에 포함된 Transfer 이벤트만 필터링한다.
  filterByTargetWallet(transferEvents: TransferEvent[]): TransferEvent[] {
    const normalizedTarget = this.targetWalletAddress.toLowerCase();

    return transferEvents.filter(
      (event) =>
        event.getFrom().toLowerCase() === normalizedTarget ||
        event.getTo().toLowerCase() === normalizedTarget,
    );
  }

  // 중복 없이 트랜잭션 해시 목록을 추출한다.
  getUniqueTransactionHashes(transferEvents: TransferEvent[]): string[] {
    return [
      ...new Set(transferEvents.map((event) => event.getTransactionHash())),
    ];
  }
}
