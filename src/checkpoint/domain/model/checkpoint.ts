import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

export class Checkpoint {
  constructor(
    public readonly type: CheckpointType,
    public readonly lastProcessedBlock: bigint,
    public readonly updatedAt: number,
  ) {
    this.validate();
  }

  public static create(
    type: CheckpointType,
    lastProcessedBlock: bigint,
    updatedAt: number,
  ): Checkpoint {
    return new Checkpoint(type, lastProcessedBlock, updatedAt);
  }

  private validate(): void {
    if (
      this.type !== CheckpointType.BACKFILL &&
      this.type !== CheckpointType.FORWARDFILL
    ) {
      throw new Error("Checkpoint type must be either BACKFILL or FORWARDFILL");
    }

    if (this.lastProcessedBlock < 0n) {
      throw new Error("Last processed block must be >= 0");
    }

    if (this.updatedAt < 0) {
      throw new Error("Updated at timestamp must be >= 0");
    }
  }

  public getType(): CheckpointType {
    return this.type;
  }

  public getLastProcessedBlock(): bigint {
    return this.lastProcessedBlock;
  }

  public getUpdatedAt(): number {
    return this.updatedAt;
  }
}
