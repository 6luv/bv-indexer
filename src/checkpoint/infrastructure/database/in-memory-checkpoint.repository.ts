import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";
import { CheckpointRepository } from "@/checkpoint/domain/repository/checkpoint.repository";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

export class InMemoryCheckpointRepository implements CheckpointRepository {
  private readonly checkpoints = new Map<CheckpointType, Checkpoint>();

  async findByType(type: CheckpointType): Promise<Checkpoint | null> {
    return this.checkpoints.get(type) ?? null;
  }

  async save(checkpoint: Checkpoint): Promise<void> {
    if (this.checkpoints.has(checkpoint.type)) return;
    this.checkpoints.set(checkpoint.type, checkpoint);
  }

  async update(checkpoint: Checkpoint): Promise<void> {
    this.checkpoints.set(checkpoint.type, checkpoint);
  }

  async delete(type: CheckpointType): Promise<void> {
    this.checkpoints.delete(type);
  }
}
