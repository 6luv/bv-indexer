import { Log } from "@/log/domain/model/log";
import { TransferEventRepository } from "../domain/repository/transfer-event.repository";
import { TransferEventDecoder } from "./decoder/transfer-event.decoder";
import { TransferEvent } from "../domain/model/transfer-event";

export class TransferEventService {
  constructor(
    private readonly transferEventRepository: TransferEventRepository,
    private readonly transferEventDecoder: TransferEventDecoder,
  ) {}

  // 단일 로그를 Transfer 이벤트로 디코딩
  async decodeTransferEventLog(log: Log): Promise<TransferEvent | null> {
    return this.transferEventDecoder.decode(log);
  }

  // 여러 로그 중 Transfer 이벤트 로그만 필터링하여 디코딩
  async decodeTransferEventLogs(logs: Log[]): Promise<TransferEvent[]> {
    const transferEvents: TransferEvent[] = [];

    for (const log of logs) {
      const decoded = await this.decodeTransferEventLog(log);
      if (decoded) transferEvents.push(decoded);
    }

    return transferEvents;
  }

  // Transfer 이벤트 여러 개 저장
  async saveTransferEvents(transferEvents: TransferEvent[]): Promise<void> {
    if (transferEvents.length === 0) return;
    const newTransferEvents: TransferEvent[] = [];

    for (const transferEvent of transferEvents) {
      const exists =
        await this.transferEventRepository.existsByTransactionHashAndLogIndex(
          transferEvent.transactionHash,
          transferEvent.logIndex,
        );

      if (!exists) newTransferEvents.push(transferEvent);
    }

    if (newTransferEvents.length === 0) return;
    await this.transferEventRepository.saveTransferEvents(newTransferEvents);
  }
}
