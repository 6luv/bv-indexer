export class Log {
  constructor(
    private readonly address: string,
    private readonly topics: string[],
    private readonly data: string,
    private readonly blockNumber: bigint,
    private readonly blockTimestamp: number,
    private readonly transactionHash: string,
    private readonly logIndex: number,
  ) {
    this.validate();
  }

  public static create(
    address: string,
    topics: string[],
    data: string,
    blockNumber: bigint,
    blockTimestamp: number,
    transactionHash: string,
    logIndex: number,
  ): Log {
    return new Log(
      address,
      topics,
      data,
      blockNumber,
      blockTimestamp,
      transactionHash,
      logIndex,
    );
  }

  private validate(): void {
    this.validateAddress(this.address, "Log address");

    if (this.topics.length === 0) {
      throw new Error("At least one log topic is required");
    }

    for (const topic of this.topics) {
      this.validateBytes32(topic, "Log topic");
    }

    if (!this.data || this.data.trim() === "") {
      throw new Error("Log data is required");
    }

    if (!this.data.startsWith("0x")) {
      throw new Error("Invalid log data format");
    }

    if (this.blockNumber < 0n) {
      throw new Error("Block number must be >= 0");
    }

    if (this.blockTimestamp < 0) {
      throw new Error("Block timestamp must be >= 0");
    }

    this.validateBytes32(this.transactionHash, "Transaction hash");

    if (this.logIndex < 0) {
      throw new Error("Log index must be >= 0");
    }
  }

  private validateAddress(value: string, fieldName: string): void {
    if (!value || value.trim() === "") {
      throw new Error(`${fieldName} is required`);
    }

    if (!value.startsWith("0x") || value.length !== 42) {
      throw new Error(`Invalid ${fieldName.toLowerCase()} format`);
    }
  }

  private validateBytes32(value: string, fieldName: string): void {
    if (!value || value.trim() === "") {
      throw new Error(`${fieldName} is required`);
    }

    if (!value.startsWith("0x") || value.length !== 66) {
      throw new Error(`Invalid ${fieldName.toLowerCase()} format`);
    }
  }

  public getAddress(): string {
    return this.address;
  }

  public getTopics(): string[] {
    return this.topics;
  }

  public getData(): string {
    return this.data;
  }

  public getBlockNumber(): bigint {
    return this.blockNumber;
  }

  public getBlockTimestamp(): number {
    return this.blockTimestamp;
  }

  public getTransactionHash(): string {
    return this.transactionHash;
  }

  public getLogIndex(): number {
    return this.logIndex;
  }
}
