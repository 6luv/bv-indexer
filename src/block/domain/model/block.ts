export type BlockProps = {
  number: bigint;
  hash: string;
  parentHash: string;
  timestamp: number;
};

export class Block {
  public readonly number: bigint;
  public readonly hash: string;
  public readonly parentHash: string;
  public readonly timestamp: number;

  constructor(props: BlockProps) {
    this.validate(props);
    this.number = props.number;
    this.hash = props.hash;
    this.parentHash = props.parentHash;
    this.timestamp = props.timestamp;
  }

  private validate(props: BlockProps): void {
    if (props.number < 0n) {
      throw new Error("Block number must be >= 0");
    }

    if (!props.hash || props.hash.trim() === "") {
      throw new Error("Block hash is required");
    }

    if (!props.hash.startsWith("0x")) {
      throw new Error("Invalid block hash format");
    }

    if (props.hash.length !== 66) {
      throw new Error("Invalid block hash length");
    }

    if (!props.parentHash || props.parentHash.trim() === "") {
      throw new Error("Parent hash is required");
    }

    if (!props.parentHash.startsWith("0x")) {
      throw new Error("Invalid parent hash format");
    }

    if (props.parentHash.length !== 66) {
      throw new Error("Invalid parent hash length");
    }

    if (props.timestamp < 0) {
      throw new Error("Timestamp must be >= 0");
    }
  }
}
