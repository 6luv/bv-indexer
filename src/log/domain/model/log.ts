export type LogProps = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: bigint;
  blockTimestamp: number;
  transactionHash: string;
  logIndex: number;
};

export class Log {
  public readonly address: string;
  public readonly topics: string[];
  public readonly data: string;
  public readonly blockNumber: bigint;
  public readonly blockTimestamp: number;
  public readonly transactionHash: string;
  public readonly logIndex: number;

  constructor(props: LogProps) {
    this.validate(props);
    this.address = props.address;
    this.topics = props.topics;
    this.data = props.data;
    this.blockNumber = props.blockNumber;
    this.blockTimestamp = props.blockTimestamp;
    this.transactionHash = props.transactionHash;
    this.logIndex = props.logIndex;
  }

  private validate(props: LogProps): void {
    if (!props.address || props.address.trim() === "") {
      throw new Error("Log address is required");
    }

    if (!props.address.startsWith("0x")) {
      throw new Error("Invalid log address format");
    }

    if (!props.topics || props.topics.length === 0) {
      throw new Error("At least one log topic is required");
    }

    for (const topic of props.topics) {
      if (!topic || topic.trim() === "") {
        throw new Error("Log topic cannot be empty");
      }

      if (!topic.startsWith("0x")) {
        throw new Error("Invalid log topic format");
      }

      if (topic.length !== 66) {
        throw new Error(
          "Log topic must be 32 bytes (66 characters with '0x' prefix)",
        );
      }
    }

    if (!props.data || props.data.trim() === "") {
      throw new Error("Log data is required");
    }

    if (!props.data.startsWith("0x")) {
      throw new Error("Invalid log data format");
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
