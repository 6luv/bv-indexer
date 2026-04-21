import { BlockRepository } from "../../domain/repository/block.repository";
import { Block } from "../../domain/model/block";

export class InMemoryBlockRepository implements BlockRepository {
  private readonly blocks = new Map<string, Block>();

  async saveBlock(block: Block): Promise<void> {
    const key = block.number.toString();
    if (this.blocks.has(key)) return;

    this.blocks.set(key, block);
  }

  async saveBlocks(blocks: Block[]): Promise<void> {
    for (const block of blocks) {
      const key = block.number.toString();
      if (this.blocks.has(key)) continue;

      this.blocks.set(block.number.toString(), block);
    }
  }

  async findBlockByBlockNumber(blockNumber: bigint): Promise<Block | null> {
    return this.blocks.get(blockNumber.toString()) ?? null;
  }

  async existsByBlockNumber(blockNumber: bigint): Promise<boolean> {
    return this.blocks.has(blockNumber.toString());
  }

  async getLatestSavedBlockNumber(): Promise<bigint | null> {
    if (this.blocks.size === 0) return null;

    const numbers = Array.from(this.blocks.keys()).map((v) => BigInt(v));
    return numbers.reduce((max, current) => (current > max ? current : max));
  }
}
