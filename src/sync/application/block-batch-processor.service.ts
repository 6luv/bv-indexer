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
