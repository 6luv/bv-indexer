import { Log } from "../domain/model/log";
import { LogRepository } from "../domain/repository/log.repository";

export class InMemoryLogRepository implements LogRepository {
  private readonly logs = new Map<string, Log>();

  private createKey(transactionHash: string, logIndex: number): string {
    return `${transactionHash}-${logIndex}`;
  }

  async saveLog(log: Log): Promise<void> {
    const key = this.createKey(log.transactionHash, log.logIndex);
    if (this.logs.has(key)) return;

    this.logs.set(key, log);
  }

  async saveLogs(logs: Log[]): Promise<void> {
    for (const log of logs) {
      const key = this.createKey(log.transactionHash, log.logIndex);
      if (this.logs.has(key)) continue;

      this.logs.set(key, log);
    }
  }

  async findLogByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<Log | null> {
    const key = this.createKey(transactionHash, logIndex);
    return this.logs.get(key) ?? null;
  }

  async findLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    return Array.from(this.logs.values()).filter(
      (log) => log.blockNumber === blockNumber,
    );
  }

  async existsByTransactionHashAndLogIndex(
    transactionHash: string,
    logIndex: number,
  ): Promise<boolean> {
    const key = this.createKey(transactionHash, logIndex);
    return this.logs.has(key);
  }
}
