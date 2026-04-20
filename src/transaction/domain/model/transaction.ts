export type TransactionProps = {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  blockHash: string;
  blockNumber: bigint;
  blockTimestamp: number;
};

export class Transaction {
  public readonly hash: string;
  public readonly from: string;
  public readonly to: string;
  public readonly value: bigint;
  public readonly blockHash: string;
  public readonly blockNumber: bigint;
  public readonly blockTimestamp: number;

  constructor(props: TransactionProps) {
    this.validate(props);
    this.hash = props.hash;
    this.from = props.from;
    this.to = props.to;
    this.value = props.value;
    this.blockHash = props.blockHash;
    this.blockNumber = props.blockNumber;
    this.blockTimestamp = props.blockTimestamp;
  }

  private validate(props: TransactionProps): void {
    if (!props.hash || props.hash.trim() === "") {
      throw new Error("Transaction hash is required");
    }

    if (!props.hash.startsWith("0x")) {
      throw new Error("Invalid transaction hash format");
    }

    if (props.hash.length !== 66) {
      throw new Error("Invalid transaction hash length");
    }

    if (!props.from || props.from.trim() === "") {
      throw new Error("From address is required");
    }

    if (!props.to || props.to.trim() === "") {
      throw new Error("To address is required");
    }

    if (props.value < 0n) {
      throw new Error("Transaction value must be >= 0");
    }

    if (!props.blockHash || props.blockHash.trim() === "") {
      throw new Error("Block hash is required");
    }

    if (!props.blockHash.startsWith("0x")) {
      throw new Error("Invalid block hash format");
    }

    if (props.blockHash.length !== 66) {
      throw new Error("Invalid block hash length");
    }

    if (props.blockNumber < 0n) {
      throw new Error("Block number must be >= 0");
    }

    if (props.blockTimestamp < 0) {
      throw new Error("Block timestamp must be >= 0");
    }
  }
}
