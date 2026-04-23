import { publicClient } from "@/shared/viem/public-client";
import { LogRpcPort } from "@/transfer-indexing/application/port/log-rpc.port";
import { Log } from "@/transfer-indexing/domain/model/log";

export class LogRpcClient implements LogRpcPort {
  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    const logs = await publicClient.getLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });
    if (logs.length === 0) return [];

    return logs.map((log) =>
      Log.create(
        log.address,
        log.topics,
        log.data,
        log.blockNumber,
        Number(log.blockTimestamp),
        log.transactionHash,
        log.logIndex,
      ),
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
