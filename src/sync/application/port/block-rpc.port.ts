export interface BlockRpcPort {
  getLatestBlockNumber(): Promise<bigint>;
}
