import { publicClient } from "@/shared/viem/public-client";
import { BlockRpcPort } from "../../application/block-rpc.port";
import { Block } from "../../domain/model/block";

export class BlockRpcClient implements BlockRpcPort {
  async getLatestBlockNumber(): Promise<bigint> {
    return publicClient.getBlockNumber();
  }

  async getBlockByBlockNumber(blockNumber: bigint): Promise<Block | null> {
    const block = await publicClient.getBlock({ blockNumber });
    if (!block) return null;

    return new Block({
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: Number(block.timestamp),
    });
  }

  async getBlocksInRange(fromBlock: bigint, toBlock: bigint): Promise<Block[]> {
    const blocks: Block[] = [];

    for (let i = fromBlock; i <= toBlock; i++) {
      const block = await this.getBlockByBlockNumber(i);
      if (block) blocks.push(block);
    }

    return blocks;
  }
}
