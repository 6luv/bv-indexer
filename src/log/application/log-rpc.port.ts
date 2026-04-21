import { Log } from "../domain/model/log";

export interface LogRpcPort {
  getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]>;
  getLogsInBlockRange(fromBlock: bigint, toBlock: bigint): Promise<Log[]>;
}
