import { BlockRangeTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { BackfillBatch } from "./types/backfill-batch";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

export class RunBackfillService {
  constructor(
    private readonly blockRangeTransferService: BlockRangeTransferService,
    private readonly checkpointService: CheckpointService,
  ) {}

  // 시작 블록부터 종료 블록까지 과거 데이터 백필
  async execute(
    startBlock: bigint,
    endBlock: bigint,
    batchSize: number,
  ): Promise<void> {
    this.validateBlockRange(startBlock, endBlock);
    this.validateBatchSize(batchSize);

    const checkpoint = await this.checkpointService.getLastProcessedBlockNumber(
      CheckpointType.BACKFILL,
    );
    let adjustedStartBlock = startBlock;

    if (checkpoint && checkpoint.getLastProcessedBlock() >= startBlock) {
      adjustedStartBlock = checkpoint.getLastProcessedBlock() + 1n;
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
  private async processBatches(batches: BackfillBatch[]): Promise<void> {
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }

  // 하나의 배치 범위를 기준으로 백필 수행
  private async processBatch(batch: BackfillBatch): Promise<void> {
    const { fromBlock, toBlock } = batch;

    const result = await this.blockRangeTransferService.execute(
      fromBlock,
      toBlock,
    );
    console.log(
      `[BackfillService] indexed transfer events: ${result.indexedTransferEventCount}`,
    );

    // 체크포인트 갱신
    await this.checkpointService.updateLastProcessedBlockNumber(
      toBlock,
      CheckpointType.BACKFILL,
    );
  }
}
