import { Log } from "@/transfer-indexing/domain/model/log";

export const LOG_READER = Symbol("LOG_READER");

export interface LogReader {
  getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]>;
  getLogsInBlockRange(fromBlock: bigint, toBlock: bigint): Promise<Log[]>;
}
