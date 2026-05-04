import { Log } from "@/transfer-indexing/domain/model/log";

export interface LogReader {
  getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]>;
  getLogsInBlockRange(fromBlock: bigint, toBlock: bigint): Promise<Log[]>;
}
