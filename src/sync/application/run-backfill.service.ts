import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Injectable } from "@nestjs/common";
import { BackfillValidator } from "../domain/service/backfill-validator.domain.service";
import { BlockBatchProcessor } from "./block-batch-processor.service";

@Injectable()
export class RunBackfillService {
  private readonly backfillValidator = new BackfillValidator();

  constructor(
    private readonly checkpointService: CheckpointService,
    private readonly blockBatchProcessor: BlockBatchProcessor,
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
    await this.blockBatchProcessor.processAll(batches);
  }

  // 시작 블록부터 종료 블록까지 batchSize 단위로 분할
  private createBatches(
    startBlock: bigint,
    endBlock: bigint,
    batchSize: number,
  ): { fromBlock: bigint; toBlock: bigint }[] {
    const batches: { fromBlock: bigint; toBlock: bigint }[] = [];
    const step = BigInt(batchSize);

    for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += step) {
      const toBlock =
        fromBlock + step - 1n <= endBlock ? fromBlock + step - 1n : endBlock;

      batches.push({ fromBlock, toBlock });
    }
    return batches;
  }
}
