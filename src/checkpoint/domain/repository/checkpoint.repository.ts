import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Checkpoint } from "../model/checkpoint";

export interface CheckpointRepository {
  findByType(type: CheckpointType): Promise<Checkpoint | null>;
  save(checkpoint: Checkpoint): Promise<void>;
  update(checkpoint: Checkpoint): Promise<void>;
  delete(type: CheckpointType): Promise<void>;
}
