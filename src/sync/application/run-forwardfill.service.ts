import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { BlockTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { BlockRpcPort } from "./port/block-rpc.port";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

export class RunForwardfillService {
  constructor(
    private readonly blockRpcPort: BlockRpcPort,
    private readonly blockTransferService: BlockTransferService,
    private readonly checkpointService: CheckpointService,
    private readonly pollingIntervalMs: number = 3000,
  ) {}

  // 체크포인트 이후부터 최신 블록까지 polling 방식으로 처리
  async execute(): Promise<void> {
    const checkpoint = await this.checkpointService.getLastProcessedBlockNumber(
      CheckpointType.FORWARDFILL,
    );

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
    const result = await this.blockTransferService.execute(blockNumber);
    console.log(
      `[ForwardfillService] indexed transfer events: ${result.indexedTransferEventCount}`,
    );

    // 체크포인트 갱신
    await this.checkpointService.updateLastProcessedBlockNumber(
      blockNumber,
      CheckpointType.FORWARDFILL,
    );
  }

  // 최초 시작 블록 결정
  private async getInitialBlockNumber(): Promise<bigint> {
    return this.getLatestBlockNumber();
  }

  // 최신 블록 번호 조회
  private async getLatestBlockNumber(): Promise<bigint> {
    return this.blockRpcPort.getLatestBlockNumber();
  }

  // 대기
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
