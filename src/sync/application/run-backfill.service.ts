import { BlockRangeTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { BackfillBatch } from "./types/backfill-batch";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Injectable } from "@nestjs/common";
import { BackfillValidator } from "../domain/service/backfill-validator.domain.service";

@Injectable()
export class RunBackfillService {
  private readonly backfillValidator = new BackfillValidator();

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
    this.backfillValidator.validate(startBlock, endBlock, batchSize);

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
