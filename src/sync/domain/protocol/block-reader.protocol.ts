export const BLOCK_READER = Symbol("BLOCK_READER");

export interface BlockReader {
  getLatestBlockNumber(): Promise<bigint>;
}
