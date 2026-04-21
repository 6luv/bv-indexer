import { Block } from "../domain/model/block";

export interface BlockRpcPort {
  getLatestBlockNumber(): Promise<bigint>;
  getBlockByBlockNumber(blockNumber: bigint): Promise<Block | null>;
  getBlocksInRange(fromBlock: bigint, toBlock: bigint): Promise<Block[]>;
}
