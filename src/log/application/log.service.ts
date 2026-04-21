import { Log } from "../domain/model/log";
import { LogRepository } from "../domain/repository/log.repository";
import { LogRpcPort } from "./log-rpc.port";

export class LogService {
  constructor(
    private readonly logRpcPort: LogRpcPort,
    private readonly logRepository: LogRepository,
  ) {}

  // 특정 블록 번호에 해당하는 로그 목록 조회
  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    return this.logRpcPort.getLogsByBlockNumber(blockNumber);
  }

  // 특정 범위의 로그 목록 조회
  async getLogsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Log[]> {
    if (fromBlock > toBlock)
      throw new Error("fromBlock must be less than or equal to toBlock");
    return this.logRpcPort.getLogsInBlockRange(fromBlock, toBlock);
  }

  // 로그 1개 저장
  async saveLog(log: Log): Promise<void> {
    const exists = await this.logRepository.existsByTransactionHashAndLogIndex(
      log.transactionHash,
      log.logIndex,
    );
    if (exists) return;
    await this.logRepository.saveLog(log);
  }

  // 로그 여러 개 저장
  async saveLogs(logs: Log[]): Promise<void> {
    if (logs.length === 0) return;

    for (const log of logs) {
      await this.saveLog(log);
    }
  }

  // 특정 로그가 이미 저장되어 있는지 확인
  async exists(transactionHash: string, logIndex: number): Promise<boolean> {
    return this.logRepository.existsByTransactionHashAndLogIndex(
      transactionHash,
      logIndex,
    );
  }

  // 특정 블록 번호로 로그 조회 후 저장
  async saveLogsByBlockNumber(blockNumber: bigint): Promise<void> {
    const logs = await this.logRpcPort.getLogsByBlockNumber(blockNumber);
    if (logs.length === 0) return;

    await this.saveLogs(logs);
  }

  // 특정 블록 범위의 로그 조회 후 저장
  async saveLogsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<void> {
    if (fromBlock > toBlock)
      throw new Error("fromBlock must be less than or equal to toBlock");

    const logs = await this.logRpcPort.getLogsInBlockRange(fromBlock, toBlock);
    if (logs.length === 0) return;

    await this.saveLogs(logs);
  }
}
