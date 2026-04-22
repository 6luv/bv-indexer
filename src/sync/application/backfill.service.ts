import { BlockService } from "@/block/application/block.service";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { LogService } from "@/log/application/log.service";
import { TransactionService } from "@/transaction/application/transaction.service";
import { TransferEventService } from "@/transfer-event/application/transfer-event.service";
import { BackfillBatch } from "./types/backfill-batch";

export class BackfillService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly logService: LogService,
    private readonly transferEventService: TransferEventService,
    private readonly checkpointService: CheckpointService,
    private readonly targetWalletAddress: string,
  ) {}

  // 시작 블록부터 종료 블록까지 과거 데이터 백필
  async runBackfill(
    startBlock: bigint,
    endBlock: bigint,
    batchSize: number,
  ): Promise<void> {
    this.validateBlockRange(startBlock, endBlock);
    this.validateBatchSize(batchSize);

    const checkpoint =
      await this.checkpointService.getLastProcessedBlockNumber("BACKFILL");
    let adjustedStartBlock = startBlock;

    if (checkpoint && checkpoint.lastProcessedBlock >= startBlock) {
      adjustedStartBlock = checkpoint.lastProcessedBlock + 1n;
    }

    if (adjustedStartBlock > endBlock) return;

    const batches = this.createBatches(adjustedStartBlock, endBlock, batchSize);
    await this.processBatches(batches);
  }

  // 시작 블록 > 종료 블록 검증
  private validateBlockRange(startBlock: bigint, endBlock: bigint): void {
    if (startBlock < 0n || endBlock < 0n)
      throw new Error("Block number must be >= 0");
    if (startBlock > endBlock)
      throw new Error("startBlock must be less than or equal to endBlock");
  }

  // batchSize 검증
  private validateBatchSize(batchSize: number): void {
    if (!Number.isInteger(batchSize))
      throw new Error("Batch size must be an integer");
    if (batchSize <= 0) throw new Error("Batch size must be greater than 0");
  }

  // 시작 블록부터 종료 블록까지 batchSize 단위로 분할
  private createBatches(
    startBlock: bigint,
    endBlock: bigint,
    batchSize: number,
  ): BackfillBatch[] {
    const batches: BackfillBatch[] = [];
    const step = BigInt(batchSize);

    for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += step) {
      const toBlock =
        fromBlock + step - 1n <= endBlock ? fromBlock + step - 1n : endBlock;

      batches.push({ fromBlock, toBlock });
    }
    return batches;
  }

  // 생성된 배치 목록을 순차적으로 처리
  async processBatches(batches: BackfillBatch[]): Promise<void> {
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }

  // 하나의 배치 범위를 기준으로 백필 수행
  async processBatch(batch: BackfillBatch): Promise<void> {
    const { fromBlock, toBlock } = batch;

    // 로그 조회
    const logs = await this.logService.getLogsInBlockRange(fromBlock, toBlock);
    console.log(`[BackillService] loded logs: ${logs.length}`);

    // Transfer 이벤트 디코딩
    const transferEvents =
      await this.transferEventService.decodeTransferEventLogs(logs);
    console.log(
      `[BackillService] decoded transfer events: ${transferEvents.length}`,
    );

    const normalizedTarget = this.targetWalletAddress.toLowerCase();
    const filteredTransferEvents = transferEvents.filter(
      (event) =>
        event.from.toLowerCase() === normalizedTarget ||
        event.to.toLowerCase() === normalizedTarget,
    );
    console.log(`
      [BackillService] filtered transfer events: ${filteredTransferEvents.length}`);

    const txHashes = [
      ...new Set(filteredTransferEvents.map((event) => event.transactionHash)),
    ];
    console.log(`[BackfillService] loaded transactions: ${txHashes.length}`);

    await this.transactionService.saveTransactionsByHashes(txHashes);
    await this.transferEventService.saveTransferEvents(filteredTransferEvents);

    // 체크포인트 갱신
    await this.checkpointService.updateLastProcessedBlockNumber(
      toBlock,
      "BACKFILL",
    );
  }
}
