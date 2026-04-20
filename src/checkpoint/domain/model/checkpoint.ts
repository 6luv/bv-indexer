export type CheckpointType = "BACKFILL" | "FORWARDFILL";

export type CheckpointProps = {
  type: CheckpointType;
  lastProcessedBlock: bigint;
  updatedAt: number;
};

export class Checkpoint {
  public readonly type: CheckpointType;
  public readonly lastProcessedBlock: bigint;
  public readonly updatedAt: number;

  constructor(props: CheckpointProps) {
    this.validate(props);
    this.type = props.type;
    this.lastProcessedBlock = props.lastProcessedBlock;
    this.updatedAt = props.updatedAt;
  }

  private validate(props: CheckpointProps): void {
    if (
      !props.type ||
      (props.type !== "BACKFILL" && props.type !== "FORWARDFILL")
    ) {
      throw new Error("Checkpoint type must be either BACKFILL or FORWARDFILL");
    }

    if (props.lastProcessedBlock < 0n) {
      throw new Error("Last processed block must be >= 0");
    }

    if (props.updatedAt < 0) {
      throw new Error("Updated at timestamp must be >= 0");
    }
  }
}
