import { Block } from "../domain/model/block";
import { BlockRepository } from "../domain/repository/block.repository";
import { BlockRpcPort } from "./block-rpc.port";

export class BlockService {
  constructor(
    private readonly blockRpcPort: BlockRpcPort,
    private readonly blockRepository: BlockRepository,
  ) {}

  // 최신 블록 조회
  async getLatestBlockNumber(): Promise<bigint> {
    return await this.blockRpcPort.getLatestBlockNumber();
  }

  // 특정 블록 조회
  async getBlockByBlockNumber(blockNumber: bigint): Promise<Block | null> {
    return this.blockRpcPort.getBlockByBlockNumber(blockNumber);
  }

  // 특정 범위 블록 조회
  async getBlocksInRange(fromBlock: bigint, toBlock: bigint): Promise<Block[]> {
    return this.blockRpcPort.getBlocksInRange(fromBlock, toBlock);
  }

  // 블록 1개 저장
  async saveBlock(blockNumber: bigint): Promise<void> {
    const exists = await this.blockRepository.existsByBlockNumber(blockNumber);
    if (exists) return;

    const block = await this.blockRpcPort.getBlockByBlockNumber(blockNumber);
    if (!block) return;

    await this.blockRepository.saveBlock(block);
  }

  // 블록 여러 개 저장
  async saveBlocks(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const blocks = await this.blockRpcPort.getBlocksInRange(fromBlock, toBlock);
    if (blocks.length === 0) return;

    await this.blockRepository.saveBlocks(blocks);
  }
}
