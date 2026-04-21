import { BlockService } from "@/block/application/block.service";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { LogService } from "@/log/application/log.service";
import { BackfillService } from "@/sync/application/backfill.service";
import { BackfillBatch } from "@/sync/application/types/backfill-batch";
import { TransactionService } from "@/transaction/application/transaction.service";
import { TransferEventService } from "@/transfer-event/application/transfer-event.service";

describe("BackfillService", () => {
  let backfillService: BackfillService;
  let blockService: jest.Mocked<BlockService>;
  let transactionService: jest.Mocked<TransactionService>;
  let logService: jest.Mocked<LogService>;
  let transferEventService: jest.Mocked<TransferEventService>;
  let checkpointService: jest.Mocked<CheckpointService>;

  beforeEach(() => {
    blockService = {
      saveBlocks: jest.fn(),
    } as unknown as jest.Mocked<BlockService>;

    transactionService = {
      saveTransactions: jest.fn(),
      saveTransactionsInBlockRange: jest.fn(),
    } as unknown as jest.Mocked<TransactionService>;

    logService = {
      saveLogs: jest.fn(),
      saveLogsInBlockRange: jest.fn(),
      getLogsInBlockRange: jest.fn(),
    } as unknown as jest.Mocked<LogService>;

    transferEventService = {
      decodeTransferEventLogs: jest.fn(),
      saveTransferEvents: jest.fn(),
    } as unknown as jest.Mocked<TransferEventService>;

    checkpointService = {
      updateLastProcessedBlockNumber: jest.fn(),
      getLastProcessedBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    backfillService = new BackfillService(
      blockService,
      transactionService,
      logService,
      transferEventService,
      checkpointService,
    );
  });

  describe("runBackfill", () => {
    it("startBlock이 endBlock보다 크면 에러가 발생해야 한다.", async () => {
      // Given
      const startBlock = 20n;
      const endBlock = 10n;
      const batchSize = 5;

      // When & Then
      await expect(
        backfillService.runBackfill(startBlock, endBlock, batchSize),
      ).rejects.toThrow("startBlock must be less than or equal to endBlock");
    });

    it("startBlock이 0보다 작으면 에러가 발생해야 한다.", async () => {
      // Given
      const startBlock = -1n;
      const endBlock = 10n;
      const batchSize = 5;

      // When & Then
      await expect(
        backfillService.runBackfill(startBlock, endBlock, batchSize),
      ).rejects.toThrow("Block number must be >= 0");
    });

    it("endBlock이 0보다 작으면 에러가 발생해야 한다.", async () => {
      // Given
      const startBlock = 10n;
      const endBlock = -1n;
      const batchSize = 5;

      // When & Then
      await expect(
        backfillService.runBackfill(startBlock, endBlock, batchSize),
      ).rejects.toThrow("Block number must be >= 0");
    });

    it("batchSize가 정수가 아니면 에러가 발생해야 한다.", async () => {
      // Given
      const startBlock = 10n;
      const endBlock = 20n;
      const batchSize = 1.5;

      // When & Then
      await expect(
        backfillService.runBackfill(startBlock, endBlock, batchSize),
      ).rejects.toThrow("Batch size must be an integer");
    });

    it("batchSize가 0 이하면 에러가 발생해야 한다.", async () => {
      // Given
      const startBlock = 10n;
      const endBlock = 20n;
      const batchSize = 0;

      // When & Then
      await expect(
        backfillService.runBackfill(startBlock, endBlock, batchSize),
      ).rejects.toThrow("Batch size must be greater than 0");
    });

    it("체크포인트가 없으면 startBlock부터 endBlock까지 배치를 생성하여 처리해야 한다.", async () => {
      // Given
      const startBlock = 1n;
      const endBlock = 10n;
      const batchSize = 3;
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);

      const processBatchSpy = jest
        .spyOn(backfillService, "processBatches")
        .mockResolvedValue();

      // When
      await backfillService.runBackfill(startBlock, endBlock, batchSize);

      // Then
      expect(
        checkpointService.getLastProcessedBlockNumber,
      ).toHaveBeenCalledWith("BACKFILL");
      expect(processBatchSpy).toHaveBeenCalledWith([
        { fromBlock: 1n, toBlock: 3n },
        { fromBlock: 4n, toBlock: 6n },
        { fromBlock: 7n, toBlock: 9n },
        { fromBlock: 10n, toBlock: 10n },
      ]);
    });

    it("체크포인트가 startBlock 이상이면 checkpoint 다음 블록부터 배치를 생성하여 처리해야 한다.", async () => {
      // Given
      const startBlock = 1n;
      const endBlock = 10n;
      const batchSize = 3;
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue({
        lastProcessedBlock: 5n,
      } as any);

      const processBatchSpy = jest
        .spyOn(backfillService, "processBatches")
        .mockResolvedValue();

      // When
      await backfillService.runBackfill(startBlock, endBlock, batchSize);

      // Then
      expect(processBatchSpy).toHaveBeenCalledWith([
        { fromBlock: 6n, toBlock: 8n },
        { fromBlock: 9n, toBlock: 10n },
      ]);
    });

    it("체크포인트가 startBlock보다 작으면 startBlock부터 배치를 생성하여 처리해야 한다.", async () => {
      // Given
      const startBlock = 5n;
      const endBlock = 10n;
      const batchSize = 2;
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue({
        lastProcessedBlock: 3n,
      } as any);

      const processBatchSpy = jest
        .spyOn(backfillService, "processBatches")
        .mockResolvedValue();

      // When
      await backfillService.runBackfill(startBlock, endBlock, batchSize);

      // Then
      expect(processBatchSpy).toHaveBeenCalledWith([
        { fromBlock: 5n, toBlock: 6n },
        { fromBlock: 7n, toBlock: 8n },
        { fromBlock: 9n, toBlock: 10n },
      ]);
    });

    it("조정된 시작 블록이 endBlock보다 크면 배치를 처리하지 않아야 한다.", async () => {
      // Given
      const startBlock = 1n;
      const endBlock = 10n;
      const batchSize = 3;
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue({
        lastProcessedBlock: 10n,
      } as any);

      const processeBatchSpy = jest.spyOn(backfillService, "processBatches");

      // When
      await backfillService.runBackfill(startBlock, endBlock, batchSize);

      // Then
      expect(processeBatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("processBatches", () => {
    it("배치 목록을 순차적으로 processBatch에 전달해야 한다.", async () => {
      // Given
      const batches: BackfillBatch[] = [
        { fromBlock: 1n, toBlock: 3n },
        { fromBlock: 4n, toBlock: 6n },
      ];
      const processBatchSpy = jest
        .spyOn(backfillService, "processBatch")
        .mockResolvedValue();

      // When
      await backfillService.processBatches(batches);

      // Then
      expect(processBatchSpy).toHaveBeenCalledTimes(2);
      expect(processBatchSpy).toHaveBeenNthCalledWith(1, {
        fromBlock: 1n,
        toBlock: 3n,
      });
      expect(processBatchSpy).toHaveBeenNthCalledWith(2, {
        fromBlock: 4n,
        toBlock: 6n,
      });
    });

    it("배치 목록이 비어 있으면 processBatch를 호출하지 않아야 한다.", async () => {
      // Given
      const batches: BackfillBatch[] = [];
      const processBatchSpy = jest.spyOn(backfillService, "processBatch");

      // When
      await backfillService.processBatches(batches);

      // Then
      expect(processBatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("processBatch", () => {
    it("배치 처리 중 모든 저장 단계가 성공하면 체크포인트를 갱신해야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };
      const logs = [{ id: 1 }] as any;
      const transferEvents = [{ id: "event-1" }] as any;

      blockService.saveBlocks.mockResolvedValue();
      transactionService.saveTransactionsInBlockRange.mockResolvedValue();
      logService.saveLogsInBlockRange.mockResolvedValue();
      logService.getLogsInBlockRange.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockResolvedValue(
        transferEvents,
      );
      transferEventService.saveTransferEvents.mockResolvedValue();
      checkpointService.updateLastProcessedBlockNumber.mockResolvedValue();

      // When
      await backfillService.processBatch(batch);

      // Then
      expect(blockService.saveBlocks).toHaveBeenCalledWith(1n, 5n);
      expect(
        transactionService.saveTransactionsInBlockRange,
      ).toHaveBeenCalledWith(1n, 5n);
      expect(logService.saveLogsInBlockRange).toHaveBeenCalledWith(1n, 5n);
      expect(logService.getLogsInBlockRange).toHaveBeenCalledWith(1n, 5n);
      expect(transferEventService.decodeTransferEventLogs).toHaveBeenCalledWith(
        logs,
      );
      expect(transferEventService.saveTransferEvents).toHaveBeenCalledWith(
        transferEvents,
      );
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).toHaveBeenCalledWith(5n, "BACKFILL");
    });

    it("블록 저장에 실패하면 이후 단계가 수행되지 않아야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };

      blockService.saveBlocks.mockRejectedValue(new Error("block save failed"));

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "block save failed",
      );

      expect(
        transactionService.saveTransactionsInBlockRange,
      ).not.toHaveBeenCalled();
      expect(logService.saveLogsInBlockRange).not.toHaveBeenCalled();
      expect(logService.getLogsInBlockRange).not.toHaveBeenCalled();
      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("트랜잭션 저장에 실패하면 이후 단계가 수행되지 않아야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };

      blockService.saveBlocks.mockResolvedValue();
      transactionService.saveTransactionsInBlockRange.mockRejectedValue(
        new Error("transaction save failed"),
      );

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "transaction save failed",
      );

      expect(logService.saveLogsInBlockRange).not.toHaveBeenCalled();
      expect(logService.getLogsInBlockRange).not.toHaveBeenCalled();
      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("로그 저장에 실패하면 이후 단계가 수행되지 않아야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };

      blockService.saveBlocks.mockResolvedValue();
      transactionService.saveTransactionsInBlockRange.mockResolvedValue();
      logService.saveLogsInBlockRange.mockRejectedValue(
        new Error("log save failed"),
      );

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "log save failed",
      );

      expect(logService.getLogsInBlockRange).not.toHaveBeenCalled();
      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("로그 조회에 실패하면 이후 단계가 수행되지 않아야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };

      blockService.saveBlocks.mockResolvedValue();
      transactionService.saveTransactionsInBlockRange.mockResolvedValue();
      logService.saveLogsInBlockRange.mockResolvedValue();
      logService.getLogsInBlockRange.mockRejectedValue(
        new Error("log fetch failed"),
      );

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "log fetch failed",
      );

      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("Transfer 이벤트 디코딩에 실패하면 이후 단계가 수행되지 않아야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };
      const logs = [{ id: 1 }] as any;

      blockService.saveBlocks.mockResolvedValue();
      transactionService.saveTransactionsInBlockRange.mockResolvedValue();
      logService.saveLogsInBlockRange.mockResolvedValue();
      logService.getLogsInBlockRange.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockRejectedValue(
        new Error("decode failed"),
      );

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "decode failed",
      );

      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("Transfer 이벤트 저장에 실패하면 체크포인트를 갱신하지 않아야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };
      const logs = [{ id: 1 }] as any;
      const transferEvents = [{ id: "event-1" }] as any;

      blockService.saveBlocks.mockResolvedValue();
      transactionService.saveTransactionsInBlockRange.mockResolvedValue();
      logService.saveLogsInBlockRange.mockResolvedValue();
      logService.getLogsInBlockRange.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockResolvedValue(
        transferEvents,
      );
      transferEventService.saveTransferEvents.mockRejectedValue(
        new Error("transfer event save failed"),
      );

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "transfer event save failed",
      );

      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("체크포인트 갱신에 실패하면 배치 처리가 실패해야 한다", async () => {
      // Given
      const batch: BackfillBatch = { fromBlock: 1n, toBlock: 5n };
      const logs = [{ id: 1 }] as any;
      const transferEvents = [{ id: "event-1" }] as any;

      logService.getLogsInBlockRange.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockResolvedValue(
        transferEvents,
      );
      transferEventService.saveTransferEvents.mockResolvedValue();
      checkpointService.updateLastProcessedBlockNumber.mockRejectedValue(
        new Error("checkpoint update failed"),
      );

      // When & Then
      await expect(backfillService.processBatch(batch)).rejects.toThrow(
        "checkpoint update failed",
      );
    });
  });
});
