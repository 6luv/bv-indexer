import { Injectable } from "@nestjs/common";
import { LogReader } from "../domain/protocol/log-reader.protocol";
import { TransferEventIndexerService } from "./transfer-event-indexer.service";

type IndexedTransferResult = {
  logCount: number;
  decodedTransferEventCount: number;
  indexedTransferEventCount: number;
  transactionCount: number;
};

// 블록 또는 블록 범위의 로그를 조회해서 transfer 인덱싱 실행
@Injectable()
export class TransferEventService {
  constructor(
    private readonly logReader: LogReader,
    private readonly transferEventIndexerService: TransferEventIndexerService,
  ) {}

  // 블록 하나의 로그를 조회해서 Transfer 이벤트 인덱싱을 실행
  async indexByBlockNumber(
    blockNumber: bigint,
  ): Promise<IndexedTransferResult> {
    const logs = await this.logReader.getLogsByBlockNumber(blockNumber);
    return this.transferEventIndexerService.indexFromLogs(logs);
  }

  // 블록 범위의 로그를 조회해서 Transfer 이벤트 인덱싱을 실행
  async indexByBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<IndexedTransferResult> {
    if (fromBlock > toBlock) {
      throw new Error("fromBlock must be less than or equal to toBlock");
    }

    const logs = await this.logReader.getLogsInBlockRange(fromBlock, toBlock);
    return this.transferEventIndexerService.indexFromLogs(logs);
  }
}
