import { publicClient } from "@/shared/viem/public-client";
import { BlockRpcPort } from "@/sync/application/port/block-rpc.port";

export class BlockRpcClient implements BlockRpcPort {
  async getLatestBlockNumber(): Promise<bigint> {
    return publicClient.getBlockNumber();
  }
}
