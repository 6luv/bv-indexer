import { CheckpointRepository } from "../domain/repository/checkpoint.repository";
import { Checkpoint } from "../domain/model/checkpoint";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

export class CheckpointService {
  constructor(private readonly checkpointRepository: CheckpointRepository) {}

  async getLastProcessedBlockNumber(
    type: CheckpointType,
  ): Promise<Checkpoint | null> {
    return this.checkpointRepository.findByType(type);
  }

  async updateLastProcessedBlockNumber(
    blockNumber: bigint,
    type: CheckpointType,
  ): Promise<void> {
    const existingCheckpoint = await this.checkpointRepository.findByType(type);
    const checkpoint = Checkpoint.create(type, blockNumber, Date.now());

    if (existingCheckpoint) {
      await this.checkpointRepository.update(checkpoint);
      return;
    }

    await this.checkpointRepository.save(checkpoint);
  }

  async deleteCheckpoint(type: CheckpointType): Promise<void> {
    await this.checkpointRepository.delete(type);
  }
}
