import { publicClient } from "@/shared/viem/public-client";
import { BlockReader } from "@/sync/domain/protocol/block-reader.protocol";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ViemBlockReader implements BlockReader {
  async getLatestBlockNumber(): Promise<bigint> {
    return publicClient.getBlockNumber();
  }
}
