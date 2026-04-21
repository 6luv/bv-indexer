import { LogRpcPort } from "@/log/application/log-rpc.port";
import { Log } from "@/log/domain/model/log";

export class LogRpcClient implements LogRpcPort {
  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    return [
      new Log({
        address: "0x" + "1".repeat(40),
        topics: ["0x" + "2".repeat(64)],
        data: "0x" + "3".repeat(64),
        blockNumber,
        blockTimestamp: Date.now(),
        transactionHash: "0x" + "4".repeat(64),
        logIndex: 0,
      }),
    ];
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
