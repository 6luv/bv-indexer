export class BackfillValidator {
  validate(startBlock: bigint, endBlock: bigint, batchSize: number): void {
    this.validateBlockRange(startBlock, endBlock);
    this.validateBatchSize(batchSize);
  }

  private validateBlockRange(startBlock: bigint, endBlock: bigint): void {
    if (startBlock < 0n || endBlock < 0n) {
      throw new Error("Block number must be >= 0");
    }

    if (startBlock > endBlock) {
      throw new Error("startBlock must be less than or equal to endBlock");
    }
  }

  private validateBatchSize(batchSize: number): void {
    if (!Number.isInteger(batchSize)) {
      throw new Error("Batch size must be an integer");
    }

    if (batchSize <= 0) {
      throw new Error("Batch size must be greater than 0");
    }
  }
}
