import { BlockRpcPort } from "../../application/block-rpc.port";
import { Block } from "../../domain/model/block";

export class BlockRpcClient implements BlockRpcPort {
  async getLatestBlockNumber(): Promise<bigint> {
    // rpc
    return 0n;
  }

  async getBlockByBlockNumber(blockNumber: bigint): Promise<Block | null> {
    // rpc
    return new Block({
      number: 0n,
      hash: "0x" + "0".repeat(64),
      parentHash: "0x" + "0".repeat(64),
      timestamp: Date.now(),
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
