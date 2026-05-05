import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Injectable } from "@nestjs/common";
import { BlockReader } from "../domain/protocol/block-reader.protocol";
import { BlockBatchProcessor } from "./block-batch-processor.service";

@Injectable()
export class RunForwardfillService {
  private shouldStop = false;

  constructor(
    private readonly blockReader: BlockReader,
    private readonly checkpointService: CheckpointService,
    private readonly pollingIntervalMs: number = 3000,
    private readonly blockBatchProcessor: BlockBatchProcessor,
  ) {}

  public stop(): void {
    this.shouldStop = true;
  }

  async runForwardfill(): Promise<void> {
    this.shouldStop = false;

    const checkpoint = await this.checkpointService.getLastProcessedBlockNumber(
      CheckpointType.FORWARDFILL,
    );

    const nextBlockNumber = checkpoint
      ? checkpoint.getLastProcessedBlock() + 1n
      : await this.blockReader.getLatestBlockNumber();

    await this.startForwardfillLoop(nextBlockNumber);
  }

  private async startForwardfillLoop(nextBlockNumber: bigint): Promise<void> {
    while (!this.shouldStop) {
      const latestBlockNumber = await this.blockReader.getLatestBlockNumber();

      while (nextBlockNumber <= latestBlockNumber && !this.shouldStop) {
        await this.blockBatchProcessor.processForwardfillBlock(nextBlockNumber);
        nextBlockNumber += 1n;
      }

      if (this.shouldStop) break;

      await new Promise((resolve) =>
        setTimeout(resolve, this.pollingIntervalMs),
      );
    }
  }
}
