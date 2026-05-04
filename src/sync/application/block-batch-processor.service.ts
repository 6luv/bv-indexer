import { Injectable } from "@nestjs/common";
import { BlockRangeTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

type BackfillBatch = {
  fromBlock: bigint;
  toBlock: bigint;
};

@Injectable()
export class BlockBatchProcessor {
  constructor(
    private readonly blockRangeTransferService: BlockRangeTransferService,
    private readonly checkpointService: CheckpointService,
  ) {}

  // 생성된 배치 목록을 순차적으로 처리
  async processAll(batches: BackfillBatch[]): Promise<void> {
    for (const batch of batches) {
      await this.process(batch);
    }
  }

  // 하나의 배치 범위를 기준으로 백필 수행
  async process(batch: BackfillBatch): Promise<void> {
    const { fromBlock, toBlock } = batch;
    const result = await this.blockRangeTransferService.execute(
      fromBlock,
      toBlock,
    );

    console.log(
      `[BlockBatchProcessor] indexed transfer events: ${result.indexedTransferEventCount}`,
    );

    // 체크포인트 갱신
    await this.checkpointService.updateLastProcessedBlockNumber(
      toBlock,
      CheckpointType.BACKFILL,
    );
  }
}
