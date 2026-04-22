import { BlockService } from "@/block/application/block.service";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { LogService } from "@/log/application/log.service";
import { Log } from "@/log/domain/model/log";
import { ForwardfillService } from "@/sync/application/forwardfill.service";
import { TransactionService } from "@/transaction/application/transaction.service";
import { TransferEventService } from "@/transfer-event/application/transfer-event.service";
import { log } from "node:console";

describe("ForwardfillService", () => {
  let forwardfillService: ForwardfillService;
  let blockService: jest.Mocked<BlockService>;
  let transactionService: jest.Mocked<TransactionService>;
  let logService: jest.Mocked<LogService>;
  let transferEventService: jest.Mocked<TransferEventService>;
  let checkpointService: jest.Mocked<CheckpointService>;

  beforeEach(() => {
    blockService = {
      getLatestBlockNumber: jest.fn(),
      saveBlock: jest.fn(),
    } as unknown as jest.Mocked<BlockService>;

    transactionService = {
      saveTransactionsByBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<TransactionService>;

    logService = {
      saveLogsByBlockNumber: jest.fn(),
      getLogsByBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<LogService>;

    transferEventService = {
      decodeTransferEventLogs: jest.fn(),
      saveTransferEvents: jest.fn(),
    } as unknown as jest.Mocked<TransferEventService>;

    checkpointService = {
      getLastProcessedBlockNumber: jest.fn(),
      updateLastProcessedBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    forwardfillService = new ForwardfillService(
      blockService,
      transactionService,
      logService,
      transferEventService,
      checkpointService,
    );
  });

  describe("runForwardfill", () => {
    it("체크포인트가 있으면 checkpoint 다음 블록부터 루프를 시작해야 한다.", async () => {
      // Given
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue({
        lastProcessedBlock: 100n,
      } as any);
      const startForwardfillLoopSpy = jest
        .spyOn(forwardfillService as any, "startForwardfillLoop")
        .mockResolvedValue(undefined);

      // When
      await forwardfillService.runForwardFill();

      //Then
      expect(
        checkpointService.getLastProcessedBlockNumber,
      ).toHaveBeenCalledWith("FORWARDFILL");
      expect(startForwardfillLoopSpy).toHaveBeenCalledWith(101n);
    });

    it("체크포인트가 없으면 최신 블록 번호부터 루프를 시작해야 한다.", async () => {
      // Given
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);
      blockService.getLatestBlockNumber.mockResolvedValue(200n);

      const startForwardfillLoopSpy = jest
        .spyOn(forwardfillService as any, "startForwardfillLoop")
        .mockResolvedValue(undefined);

      // When
      await forwardfillService.runForwardFill();

      // Then
      expect(
        checkpointService.getLastProcessedBlockNumber,
      ).toHaveBeenCalledWith("FORWARDFILL");
      expect(blockService.getLatestBlockNumber).toHaveBeenCalled();
      expect(startForwardfillLoopSpy).toHaveBeenCalledWith(200n);
    });

    it("체크포인트 조회에 실패하면 에러가 발생해야 한다.", async () => {
      // Given
      checkpointService.getLastProcessedBlockNumber.mockRejectedValue(
        new Error("Checkpoint fetch failed"),
      );

      // When & Then
      await expect(forwardfillService.runForwardFill()).rejects.toThrow(
        "Checkpoint fetch failed",
      );
    });

    it("초기 최신 블록 번호 조회에 실패하면 에러가 발생해야 한다.", async () => {
      // Given
      checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);
      blockService.getLatestBlockNumber.mockRejectedValue(
        new Error("Latest block fetch failed"),
      );

      // When & Then
      await expect(forwardfillService.runForwardFill()).rejects.toThrow(
        "Latest block fetch failed",
      );
    });
  });

  describe("processBlock", () => {
    it("블록 처리 중 모든 단계가 성공하면 체크포인트를 갱신해야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      const logs = [{ logIndex: 0 }] as Log[];
      const transferEvents = [{ id: "event-1" }] as any;

      logService.getLogsByBlockNumber.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockResolvedValue(
        transferEvents,
      );
      transferEventService.saveTransferEvents.mockResolvedValue();
      checkpointService.updateLastProcessedBlockNumber.mockResolvedValue();

      // When
      await (forwardfillService as any).processBlock(blockNumber);

      // Then
      expect(blockService.saveBlock).toHaveBeenCalledWith(123n);
      expect(
        transactionService.saveTransactionsByBlockNumber,
      ).toHaveBeenCalledWith(123n);
      expect(logService.saveLogsByBlockNumber).toHaveBeenCalledWith(123n);
      expect(logService.getLogsByBlockNumber).toHaveBeenCalledWith(123n);
      expect(transferEventService.decodeTransferEventLogs).toHaveBeenCalledWith(
        logs,
      );
      expect(transferEventService.saveTransferEvents).toHaveBeenCalledWith(
        transferEvents,
      );
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).toHaveBeenCalledWith(123n, "FORWARDFILL");
    });

    it("블록 저장에 실패하면 이후 단계가 수행되지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      blockService.saveBlock.mockRejectedValue(new Error("block save failed"));

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("block save failed");

      expect(
        transactionService.saveTransactionsByBlockNumber,
      ).not.toHaveBeenCalled();
      expect(logService.saveLogsByBlockNumber).not.toHaveBeenCalled();
      expect(logService.getLogsByBlockNumber).not.toHaveBeenCalled();
      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("트랜잭션 저장에 실패하면 이후 단계가 수행되지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockRejectedValue(
        new Error("transaction save failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("transaction save failed");

      expect(logService.saveLogsByBlockNumber).not.toHaveBeenCalled();
      expect(logService.getLogsByBlockNumber).not.toHaveBeenCalled();
      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("로그 저장에 실패하면 이후 단계가 수행되지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockResolvedValue();
      logService.saveLogsByBlockNumber.mockRejectedValue(
        new Error("log save failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("log save failed");

      expect(logService.getLogsByBlockNumber).not.toHaveBeenCalled();
      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("로그 조회에 실패하면 이후 단계가 수행되지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockResolvedValue();
      logService.saveLogsByBlockNumber.mockResolvedValue();
      logService.getLogsByBlockNumber.mockRejectedValue(
        new Error("log fetch failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("log fetch failed");

      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("로그 조회에 실패하면 이후 단계가 수행되지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockResolvedValue();
      logService.saveLogsByBlockNumber.mockResolvedValue();
      logService.getLogsByBlockNumber.mockRejectedValue(
        new Error("log fetch failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("log fetch failed");

      expect(
        transferEventService.decodeTransferEventLogs,
      ).not.toHaveBeenCalled();
      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("Transfer 이벤트 디코딩에 실패하면 이후 단계가 수행되지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      const logs = [{ logIndex: 0 }] as Log[];

      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockResolvedValue();
      logService.saveLogsByBlockNumber.mockResolvedValue();
      logService.getLogsByBlockNumber.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockRejectedValue(
        new Error("decode failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("decode failed");

      expect(transferEventService.saveTransferEvents).not.toHaveBeenCalled();
      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("Transfer 이벤트 저장에 실패하면 체크포인트를 갱신하지 않아야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      const logs = [{ logIndex: 0 }] as Log[];
      const transferEvents = [{ id: "event-1" }] as any;

      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockResolvedValue();
      logService.saveLogsByBlockNumber.mockResolvedValue();
      logService.getLogsByBlockNumber.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockResolvedValue(
        transferEvents,
      );
      transferEventService.saveTransferEvents.mockRejectedValue(
        new Error("transfer event save failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("transfer event save failed");

      expect(
        checkpointService.updateLastProcessedBlockNumber,
      ).not.toHaveBeenCalled();
    });

    it("체크포인트 갱신에 실패하면 블록 처리가 실패해야 한다.", async () => {
      // Given
      const blockNumber = 123n;
      const logs = [{ logIndex: 0 }] as Log[];
      const transferEvents = [{ id: "event-1" }] as any;

      blockService.saveBlock.mockResolvedValue();
      transactionService.saveTransactionsByBlockNumber.mockResolvedValue();
      logService.saveLogsByBlockNumber.mockResolvedValue();
      logService.getLogsByBlockNumber.mockResolvedValue(logs);
      transferEventService.decodeTransferEventLogs.mockResolvedValue(
        transferEvents,
      );
      transferEventService.saveTransferEvents.mockResolvedValue();
      checkpointService.updateLastProcessedBlockNumber.mockRejectedValue(
        new Error("checkpoint update failed"),
      );

      // When & Then
      await expect(
        (forwardfillService as any).processBlock(blockNumber),
      ).rejects.toThrow("checkpoint update failed");
    });
  });
});
