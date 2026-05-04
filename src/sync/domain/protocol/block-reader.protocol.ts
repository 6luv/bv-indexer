export interface BlockReader {
  getLatestBlockNumber(): Promise<bigint>;
}
