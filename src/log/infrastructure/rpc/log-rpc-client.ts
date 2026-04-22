import { LogRpcPort } from "@/log/application/log-rpc.port";
import { Log } from "@/log/domain/model/log";
import { publicClient } from "@/shared/viem/public-client";

export class LogRpcClient implements LogRpcPort {
  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    const logs = await publicClient.getLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });
    if (logs.length === 0) return [];

    return logs.map(
      (log) =>
        new Log({
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: log.blockNumber,
          blockTimestamp: Number(log.blockTimestamp),
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
        }),
    );
  }

  async getLogsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Log[]> {
    const logs: Log[] = [];

    for (let i = fromBlock; i <= toBlock; i++) {
      const blockLogs = await this.getLogsByBlockNumber(i);
      logs.push(...blockLogs);
    }

    return logs;
  }
}
