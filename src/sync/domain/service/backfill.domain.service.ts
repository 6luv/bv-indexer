export class BackfillDomainService {
  // 시작 블록부터 종료 블록까지 batchSize 단위로 분할
  createBatches(
    startBlock: bigint,
    endBlock: bigint,
    batchSize: number,
  ): { fromBlock: bigint; toBlock: bigint }[] {
    const batches: { fromBlock: bigint; toBlock: bigint }[] = [];
    const step = BigInt(batchSize);

    for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += step) {
      const toBlock =
        fromBlock + step - 1n <= endBlock ? fromBlock + step - 1n : endBlock;

      batches.push({ fromBlock, toBlock });
    }
    return batches;
  }
}
