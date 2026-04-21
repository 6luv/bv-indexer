import { Block } from "../model/block";

export interface BlockRepository {
  saveBlock(block: Block): Promise<void>;
  saveBlocks(blocks: Block[]): Promise<void>;
  findBlockByBlockNumber(blockNumber: bigint): Promise<Block | null>;
  existsByBlockNumber(blockNumber: bigint): Promise<boolean>;
  getLatestSavedBlockNumber(): Promise<bigint | null>;
}
