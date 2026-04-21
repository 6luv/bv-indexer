import { Log } from "../model/log";

export interface LogRepository {
  saveLog(log: Log): Promise<void>;
  saveLogs(logs: Log[]): Promise<void>;
  findLogByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<Log | null>;
  findLogsByBlockNumber(blockNumber: bigint): Promise<Log[]>;
  existsByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<boolean>;
}
