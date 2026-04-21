export type TransferEventProps = {
  tokenAddress: string;
  from: string;
  to: string;
  value: bigint;
  blockNumber: bigint;
  blockTimestamp: number;
  transactionHash: string;
  logIndex: number;
};

export class TransferEvent {
  public readonly tokenAddress: string;
  public readonly from: string;
  public readonly to: string;
  public readonly value: bigint;
  public readonly blockNumber: bigint;
  public readonly blockTimestamp: number;
  public readonly transactionHash: string;
  public readonly logIndex: number;

  constructor(props: TransferEventProps) {
    this.validate(props);
    this.tokenAddress = props.tokenAddress;
    this.from = props.from;
    this.to = props.to;
    this.value = props.value;
    this.blockNumber = props.blockNumber;
    this.blockTimestamp = props.blockTimestamp;
    this.transactionHash = props.transactionHash;
    this.logIndex = props.logIndex;
  }

  private validate(props: TransferEventProps): void {
    if (!props.tokenAddress || props.tokenAddress.trim() === "") {
      throw new Error("Token address is required");
    }

    if (!props.tokenAddress.startsWith("0x")) {
      throw new Error("Invalid token address format");
    }

    if (!props.from || props.from.trim() === "") {
      throw new Error("From address is required");
    }

    if (!props.to || props.to.trim() === "") {
      throw new Error("To address is required");
    }

    if (props.value < 0n) {
      throw new Error("Transfer value must be >= 0");
    }

    if (props.blockNumber < 0n) {
      throw new Error("Block number must be >= 0");
    }

    if (props.blockTimestamp < 0) {
      throw new Error("Block timestamp must be >= 0");
    }

    if (!props.transactionHash || props.transactionHash.trim() === "") {
      throw new Error("Transaction hash is required");
    }

    if (!props.transactionHash.startsWith("0x")) {
      throw new Error("Invalid transaction hash format");
    }

    if (props.transactionHash.length !== 66) {
      throw new Error("Invalid transaction hash length");
    }

    if (props.logIndex < 0) {
      throw new Error("Log index must be >= 0");
    }
  }
}
