import { BlockService } from "@/block/application/block.service";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { LogService } from "@/log/application/log.service";
import { Log } from "@/log/domain/model/log";
import { TransactionService } from "@/transaction/application/transaction.service";
import { TransferEventService } from "@/transfer-event/application/transfer-event.service";

export class ForwardfillService {
  constructor(
    private readonly blockService: BlockService,
    private readonly transactionService: TransactionService,
    private readonly logService: LogService,
    private readonly transferEventService: TransferEventService,
    private readonly checkpointService: CheckpointService,
    private readonly targetWalletAddress: string,
    private readonly pollingIntervalMs: number = 3000,
  ) {}

  // 체크포인트 이후부터 최신 블록까지 polling 방식으로 처리
  async runForwardFill(): Promise<void> {
    const checkpoint =
      await this.checkpointService.getLastProcessedBlockNumber("FORWARDFILL");

    let nextBlockNumber = checkpoint
      ? checkpoint.lastProcessedBlock + 1n
      : await this.getInitialBlockNumber();
    await this.startForwardfillLoop(nextBlockNumber);
  }

  // 실시간 블록 처리
  private async startForwardfillLoop(nextBlockNumber: bigint): Promise<void> {
    while (true) {
      const latestBlockNumber = await this.getLatestBlockNumber();
      while (nextBlockNumber <= latestBlockNumber) {
        await this.processBlock(nextBlockNumber);
        nextBlockNumber += 1n;
      }

      await this.sleep(this.pollingIntervalMs);
    }
  }

  // 블록 1개 처리
  private async processBlock(blockNumber: bigint): Promise<void> {
    // 로그 조회
    const logs: Log[] = await this.logService.getLogsByBlockNumber(blockNumber);
    console.log(`[ForwardfillService] loaded logs: ${logs.length}`);

    // Transfer 이벤트 디코딩
    const transferEvents =
      await this.transferEventService.decodeTransferEventLogs(logs);
    console.log(
      `[ForwardfillService] decoded transfer events: ${transferEvents.length}`,
    );

    const normalizedTarget = this.targetWalletAddress.toLowerCase();
    const filteredTransferEvents = transferEvents.filter(
      (event) =>
        event.from.toLowerCase() === normalizedTarget ||
        event.to.toLowerCase() === normalizedTarget,
    );
    console.log(`
      [ForwardfillService] filtered transfer events: ${filteredTransferEvents.length}`);

    const txHashes = [
      ...new Set(filteredTransferEvents.map((event) => event.transactionHash)),
    ];
    console.log(`[ForwardfillService] loaded transactions: ${txHashes.length}`);

    await this.transactionService.saveTransactionsByHashes(txHashes);
    await this.transferEventService.saveTransferEvents(transferEvents);

    // 체크포인트 갱신
    await this.checkpointService.updateLastProcessedBlockNumber(
      blockNumber,
      "FORWARDFILL",
    );
  }

  // 최초 시작 블록 결정
  private async getInitialBlockNumber(): Promise<bigint> {
    const latestBlockNumber = await this.getLatestBlockNumber();
    return latestBlockNumber;
  }

  // 최신 블록 번호 조회
  private async getLatestBlockNumber(): Promise<bigint> {
    return this.blockService.getLatestBlockNumber();
  }

  // 대기
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
