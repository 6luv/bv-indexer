export class TransferEvent {
  constructor(
    private readonly tokenAddress: string,
    private readonly from: string,
    private readonly to: string,
    private readonly value: bigint,
    private readonly blockNumber: bigint,
    private readonly blockTimestamp: number,
    private readonly transactionHash: string,
    private readonly logIndex: number,
  ) {
    this.validate();
  }

  public static create(
    tokenAddress: string,
    from: string,
    to: string,
    value: bigint,
    blockNumber: bigint,
    blockTimestamp: number,
    transactionHash: string,
    logIndex: number,
  ): TransferEvent {
    return new TransferEvent(
      tokenAddress,
      from,
      to,
      value,
      blockNumber,
      blockTimestamp,
      transactionHash,
      logIndex,
    );
  }

  private validate(): void {
    this.validateAddress(this.tokenAddress, "Token address");
    this.validateAddress(this.from, "From address");
    this.validateAddress(this.to, "To address");

    if (this.value < 0n) {
      throw new Error("Transfer value must be >= 0");
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

  public getTokenAddress(): string {
    return this.tokenAddress;
  }

  public getFrom(): string {
    return this.from;
  }

  public getTo(): string {
    return this.to;
  }

  public getValue(): bigint {
    return this.value;
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
