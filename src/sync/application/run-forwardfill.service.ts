import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { BlockTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { BlockRpcPort } from "./port/block-rpc.port";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RunForwardfillService {
  private shouldStop = false;

  constructor(
    private readonly blockRpcPort: BlockRpcPort,
    private readonly blockTransferService: BlockTransferService,
    private readonly checkpointService: CheckpointService,
    private readonly pollingIntervalMs: number = 3000,
  ) {}

  public stop(): void {
    this.shouldStop = true;
  }

  async execute(): Promise<void> {
    this.shouldStop = false;

    const checkpoint = await this.checkpointService.getLastProcessedBlockNumber(
      CheckpointType.FORWARDFILL,
    );

    let nextBlockNumber = checkpoint
      ? checkpoint.getLastProcessedBlock() + 1n
      : await this.getInitialBlockNumber();

    await this.startForwardfillLoop(nextBlockNumber);
  }

  private async startForwardfillLoop(nextBlockNumber: bigint): Promise<void> {
    while (!this.shouldStop) {
      const latestBlockNumber = await this.getLatestBlockNumber();

      while (nextBlockNumber <= latestBlockNumber && !this.shouldStop) {
        await this.processBlock(nextBlockNumber);
        nextBlockNumber += 1n;
      }

      if (this.shouldStop) break;

      await this.sleep(this.pollingIntervalMs);
    }
  }

  private async processBlock(blockNumber: bigint): Promise<void> {
    const result = await this.blockTransferService.execute(blockNumber);
    console.log(
      `[ForwardfillService] indexed transfer events: ${result.indexedTransferEventCount}`,
    );

    await this.checkpointService.updateLastProcessedBlockNumber(
      blockNumber,
      CheckpointType.FORWARDFILL,
    );
  }

  private async getInitialBlockNumber(): Promise<bigint> {
    return this.getLatestBlockNumber();
  }

  private async getLatestBlockNumber(): Promise<bigint> {
    return this.blockRpcPort.getLatestBlockNumber();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
