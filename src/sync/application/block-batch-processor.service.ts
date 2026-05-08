import { Injectable } from "@nestjs/common";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";

type BackfillBatch = {
  fromBlock: bigint;
  toBlock: bigint;
};

@Injectable()
export class BlockBatchProcessor {
  constructor(
    private readonly transferEventService: TransferEventService,
    private readonly checkpointService: CheckpointService,
  ) {}

  // 생성된 배치 목록을 순차적으로 처리
  async processAllBackfill(
    batches: BackfillBatch[],
    concurrency = 3,
  ): Promise<void> {
    if (concurrency <= 0) {
      throw new Error("concurrency must be greater than 0");
    }

    for (let i = 0; i < batches.length; i += concurrency) {
      const chunk = batches.slice(i, i + concurrency);

      const lastBatch = chunk[chunk.length - 1];
      if (!lastBatch) {
        continue;
      }

      await Promise.all(chunk.map((batch) => this.processBackfill(batch)));

      await this.checkpointService.upsertCheckpoint(
        lastBatch.toBlock,
        CheckpointType.BACKFILL,
      );
    }
  }

  // 하나의 배치 범위를 기준으로 백필 수행
  async processBackfill(batch: BackfillBatch): Promise<void> {
    const { fromBlock, toBlock } = batch;
    const result = await this.transferEventService.indexByBlockRange(
      fromBlock,
      toBlock,
    );

    console.log(
      `[BlockBatchProcessor] indexed transfer events: ${result.indexedTransferEventCount}`,
    );
  }

  // 블록 하나를 처리
  async processForwardfillBlock(blockNumber: bigint): Promise<void> {
    const result = await this.transferEventService.indexByBlockRange(
      blockNumber,
      blockNumber,
    );

    console.log(
      `[BlockBatchProcessor] indexed forwardfill transfer events: ${result.indexedTransferEventCount}`,
    );

    await this.checkpointService.upsertCheckpoint(
      blockNumber,
      CheckpointType.FORWARDFILL,
    );
  }
}
