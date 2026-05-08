import { SyncController } from "@/sync/entry-point/sync.controller";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { BlockReader } from "@/sync/domain/protocol/block-reader.protocol";
import { LogReader } from "@/transfer-indexing/domain/protocol/log-reader.protocol";
import { TransactionReader } from "@/transfer-indexing/domain/protocol/transaction-reader.protocol";
import { Erc20TransferEventDecoder } from "@/transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { TransactionRepository } from "@/transfer-indexing/domain/repository/transaction.repository";
import { TransferEventRepository } from "@/transfer-indexing/domain/repository/transfer-event.repository";
import { RunBackfillService } from "@/sync/application/run-backfill.service";
import { RunForwardfillService } from "@/sync/application/run-forwardfill.service";

describe("SyncController", () => {
  let syncController: SyncController;
  let checkpointService: jest.Mocked<CheckpointService>;
  let blockReader: jest.Mocked<BlockReader>;
  let logReader: jest.Mocked<LogReader>;
  let transactionReader: jest.Mocked<TransactionReader>;
  let transferEventDecoder: jest.Mocked<Erc20TransferEventDecoder>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transferEventRepository: jest.Mocked<TransferEventRepository>;

  beforeEach(() => {
    checkpointService = {
      getCheckpointByType: jest.fn(),
      upsertCheckpoint: jest.fn(),
      deleteCheckpoint: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    blockReader = {
      getLatestBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<BlockReader>;

    logReader = {
      getLogsByBlockNumber: jest.fn(),
      getLogsInBlockRange: jest.fn(),
    } as unknown as jest.Mocked<LogReader>;

    transactionReader = {
      getTransactionsByBlockNumber: jest.fn(),
      getTransactionsInBlockRange: jest.fn(),
      getTransactionsByHashes: jest.fn(),
    } as unknown as jest.Mocked<TransactionReader>;

    transferEventDecoder = {
      decode: jest.fn(),
    } as unknown as jest.Mocked<Erc20TransferEventDecoder>;

    transactionRepository = {
      count: jest.fn(),
    } as unknown as jest.Mocked<TransactionRepository>;

    transferEventRepository = {
      count: jest.fn(),
    } as unknown as jest.Mocked<TransferEventRepository>;

    syncController = new SyncController(
      checkpointService,
      blockReader,
      logReader,
      transactionReader,
      transferEventDecoder,
      transactionRepository,
      transferEventRepository,
    );
  });

  it("Backfill 요청이 들어오면 작업을 비동기로 시작하고 started 응답을 반환해야 한다.", async () => {
    // Given
    const runBackfill = jest.fn().mockResolvedValue(undefined);

    const runBackfillService = {
      runBackfill,
    } as unknown as RunBackfillService;

    jest
      .spyOn(syncController as any, "createRunBackfillService")
      .mockReturnValue(runBackfillService);

    // When
    const result = await syncController.backfill({
      targetWalletAddress: "0x" + "a".repeat(40),
      startBlock: 1,
      endBlock: 10,
      batchSize: 3,
    });

    // Then
    expect(result).toEqual({
      ok: true,
      message: "Backfill started",
    });
    expect(runBackfill).toHaveBeenCalledTimes(1);
    expect(runBackfill).toHaveBeenCalledWith(1n, 10n, 3);
  });

  it("Backfill 실행 중 다시 요청하면 중복 실행이 되지 않아야 한다.", async () => {
    // Given
    const neverEndingPromise = new Promise<void>(() => {});
    const runBackfill = jest.fn().mockReturnValue(neverEndingPromise);
    const runBackfillService = {
      runBackfill,
    } as unknown as RunBackfillService;

    jest
      .spyOn(syncController as any, "createRunBackfillService")
      .mockReturnValue(runBackfillService);

    const body = {
      targetWalletAddress: "0x" + "a".repeat(40),
      startBlock: 1,
      endBlock: 10,
      batchSize: 3,
    };

    // When
    const firstResult = await syncController.backfill(body);
    const secondResult = await syncController.backfill(body);

    // Then
    expect(firstResult).toEqual({
      ok: true,
      message: "Backfill started",
    });
    expect(secondResult).toEqual({
      ok: false,
      message: "Backfill is already running",
    });
    expect(runBackfill).toHaveBeenCalledTimes(1);
  });

  it("Backfill 실행 중 에러가 발생하면 logger.error를 호출하고 실행 상태를 해제해야 한다.", async () => {
    // Given
    const error = new Error("Backfill error");
    const runBackfill = jest.fn().mockRejectedValue(error);
    const runBackfillService = {
      runBackfill,
    } as unknown as RunBackfillService;

    jest
      .spyOn(syncController as any, "createRunBackfillService")
      .mockReturnValue(runBackfillService);

    const loggerErrorSpy = jest
      .spyOn((syncController as any).logger, "error")
      .mockImplementation();

    // When
    const result = await syncController.backfill({
      targetWalletAddress: "0x" + "a".repeat(40),
      startBlock: 1,
      endBlock: 10,
      batchSize: 3,
    });

    await new Promise(process.nextTick);

    // Then
    expect(result).toEqual({
      ok: true,
      message: "Backfill started",
    });
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Backfill failed: Backfill error",
      error.stack,
    );
    expect((syncController as any).lastErrorMessage).toBe("Backfill error");
    expect((syncController as any).isBackfillRunning).toBe(false);
  });

  it("Forwardfill 요청이 들어오면 작업을 비동기로 시작하고 started 응답을 반환해야 한다.", async () => {
    // Given
    const runForwardfill = jest.fn().mockResolvedValue(undefined);
    const stop = jest.fn();

    const runForwardfillService = {
      runForwardfill,
      stop,
    } as unknown as RunForwardfillService;

    jest
      .spyOn(syncController as any, "createRunForwardfillService")
      .mockReturnValue(runForwardfillService);

    // When
    const result = await syncController.forwardfill({
      targetWalletAddress: "0x" + "a".repeat(40),
      pollingIntervalMs: 3000,
    });

    // Then
    expect(result).toEqual({
      ok: true,
      message: "Forwardfill started",
    });
    expect(runForwardfill).toHaveBeenCalledTimes(1);
    expect((syncController as any).activeForwardfillService).toBe(
      runForwardfillService,
    );
  });

  it("Forwardfill 실행 중 다시 요청하면 중복 실행이 되지 않아야 한다.", async () => {
    // Given
    const neverEndingPromise = new Promise<void>(() => {});

    const runForwardfill = jest.fn().mockReturnValue(neverEndingPromise);
    const stop = jest.fn();

    const runForwardfillService = {
      runForwardfill,
      stop,
    } as unknown as RunForwardfillService;

    jest
      .spyOn(syncController as any, "createRunForwardfillService")
      .mockReturnValue(runForwardfillService);

    const body = {
      targetWalletAddress: "0x" + "a".repeat(40),
      pollingIntervalMs: 3000,
    };

    // When
    const firstResult = await syncController.forwardfill(body);
    const secondResult = await syncController.forwardfill(body);

    // Then
    expect(firstResult).toEqual({
      ok: true,
      message: "Forwardfill started",
    });
    expect(secondResult).toEqual({
      ok: false,
      message: "Forwardfill is already running",
    });
    expect(runForwardfill).toHaveBeenCalledTimes(1);
  });

  it("Forwardfill stop 요청이 들어오면 stop을 호출해야 한다.", async () => {
    // Given
    const neverEndingPromise = new Promise<void>(() => {});

    const runForwardfill = jest.fn().mockReturnValue(neverEndingPromise);
    const stop = jest.fn();

    const runForwardfillService = {
      runForwardfill,
      stop,
    } as unknown as RunForwardfillService;

    jest
      .spyOn(syncController as any, "createRunForwardfillService")
      .mockReturnValue(runForwardfillService);

    await syncController.forwardfill({
      targetWalletAddress: "0x" + "a".repeat(40),
      pollingIntervalMs: 3000,
    });

    // When
    const result = await syncController.stopForwardfill();

    // Then
    expect(result).toEqual({
      ok: true,
      message: "Forwardfill stop requested",
    });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("Forwardfill이 실행 중이 아니면 stop 요청 시 실패 응답을 반환해야 한다.", async () => {
    // When
    const result = await syncController.stopForwardfill();

    // Then
    expect(result).toEqual({
      ok: false,
      message: "Forwardfill is not running",
    });
  });

  it("status 조회 시 현재 상태와 저장된 데이터 개수를 반환해야 한다.", async () => {
    // Given
    checkpointService.getCheckpointByType.mockResolvedValue(null);
    blockReader.getLatestBlockNumber.mockResolvedValue(100n);
    transactionRepository.count.mockResolvedValue(2);
    transferEventRepository.count.mockResolvedValue(3);

    // When
    const result = await syncController.getStatus();

    // Then
    expect(result).toMatchObject({
      mode: "BACKFILL",
      status: "IDLE",
      targetWalletAddress: null,
      latestBlock: 100,
      lastProcessedBlock: null,
      savedTransactionCount: 2,
      savedTransferEventCount: 3,
      errorMessage: null,
    });

    expect(checkpointService.getCheckpointByType).toHaveBeenCalledWith(
      CheckpointType.BACKFILL,
    );
    expect(checkpointService.getCheckpointByType).toHaveBeenCalledWith(
      CheckpointType.FORWARDFILL,
    );
  });
});
