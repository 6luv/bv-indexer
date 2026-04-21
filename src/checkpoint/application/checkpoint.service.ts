import { Checkpoint, CheckpointType } from "../domain/model/checkpoint";
import { CheckpointRepository } from "../domain/repository/checkpoint.repository";

export class CheckpointService {
  constructor(private readonly checkpointRepository: CheckpointRepository) {}

  // 체크포인트 조회
  async getLastProcessedBlockNumber(
    type: CheckpointType,
  ): Promise<Checkpoint | null> {
    return this.checkpointRepository.findByType(type);
  }

  // 체크포인트 저장
  async saveLastProcessedBlockNumber(
    blockNumber: bigint,
    type: CheckpointType,
  ): Promise<void> {
    const checkpoint = new Checkpoint({
      type,
      lastProcessedBlock: blockNumber,
      updatedAt: Date.now(),
    });
  }

  // 체크포인트 갱신
  async updateLastProcessedBlockNumber(
    blockNumber: bigint,
    type: CheckpointType,
  ): Promise<void> {
    const existingCheckpoint = await this.checkpointRepository.findByType(type);
    const checkpoint = new Checkpoint({
      type,
      lastProcessedBlock: blockNumber,
      updatedAt: Date.now(),
    });

    if (existingCheckpoint) {
      await this.checkpointRepository.update(checkpoint);
      return;
    }
    await this.checkpointRepository.save(checkpoint);
  }

  // 체크포인트 초기화
  async clearCheckpoint(type: CheckpointType): Promise<void> {
    const existingCheckpoint = await this.checkpointRepository.findByType(type);
    if (!existingCheckpoint) return;

    await this.checkpointRepository.delete(type);
  }
}
