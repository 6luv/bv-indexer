export class Transaction {
  constructor(
    private readonly hash: string,
    private readonly from: string,
    private readonly to: string,
    private readonly value: bigint,
    private readonly blockHash: string,
    private readonly blockNumber: bigint,
    private readonly blockTimestamp: number,
  ) {
    this.validate();
  }

  public static create(
    hash: string,
    from: string,
    to: string,
    value: bigint,
    blockHash: string,
    blockNumber: bigint,
    blockTimestamp: number,
  ): Transaction {
    return new Transaction(
      hash,
      from,
      to,
      value,
      blockHash,
      blockNumber,
      blockTimestamp,
    );
  }

  private validate(): void {
    this.validateBytes32(this.hash, "Transaction hash");
    this.validateAddress(this.from, "From address");

    if (this.to !== "") {
      this.validateAddress(this.to, "To address");
    }

    if (this.value < 0n) {
      throw new Error("Transaction value must be >= 0");
    }

    this.validateBytes32(this.blockHash, "Block hash");

    if (this.blockNumber < 0n) {
      throw new Error("Block number must be >= 0");
    }

    if (this.blockTimestamp < 0) {
      throw new Error("Block timestamp must be >= 0");
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

  public getHash(): string {
    return this.hash;
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

  public getBlockHash(): string {
    return this.blockHash;
  }

  public getBlockNumber(): bigint {
    return this.blockNumber;
  }

  public getBlockTimestamp(): number {
    return this.blockTimestamp;
  }
}
