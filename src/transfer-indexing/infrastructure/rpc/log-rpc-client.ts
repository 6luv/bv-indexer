import { publicClient } from "@/shared/viem/public-client";
import { LogRpcPort } from "@/transfer-indexing/application/port/log-rpc.port";
import { Log } from "@/transfer-indexing/domain/model/log";
import { parseAbiItem } from "viem";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export class LogRpcClient implements LogRpcPort {
  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    const logs = await publicClient.getLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
      event: transferEvent,
      strict: true,
    });

    if (logs.length === 0) return [];

    return logs.flatMap((log) => {
      const blockNumberValue = log.blockNumber;
      const transactionHash = log.transactionHash;
      const blockTimestamp = log.blockTimestamp;
      const logIndex = log.logIndex;

      if (
        blockNumberValue === null ||
        blockNumberValue === undefined ||
        !transactionHash ||
        logIndex === null ||
        logIndex === undefined
      ) {
        return [];
      }

      return [
        Log.create(
          log.address,
          [...log.topics],
          log.data,
          blockNumberValue,
          Number(blockTimestamp),
          transactionHash,
          Number(logIndex),
        ),
      ];
    });
  }

  async getLogsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Log[]> {
    const logs = await publicClient.getLogs({
      fromBlock,
      toBlock,
      event: transferEvent,
      strict: true,
    });

    if (logs.length === 0) return [];

    return logs.flatMap((log) => {
      const blockNumberValue = log.blockNumber;
      const transactionHash = log.transactionHash;
      const blockTimestamp = log.blockTimestamp;
      const logIndex = log.logIndex;

      if (
        blockNumberValue === null ||
        blockNumberValue === undefined ||
        !transactionHash ||
        logIndex === null ||
        logIndex === undefined
      ) {
        return [];
      }

      return [
        Log.create(
          log.address,
          [...log.topics],
          log.data,
          blockNumberValue,
          Number(blockTimestamp),
          transactionHash,
          Number(logIndex),
        ),
      ];
    });
  }
}
