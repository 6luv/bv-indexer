import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { BlockRangeTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { RunBackfillService } from "./run-backfill.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";

describe("RunBackfillService", () => {
  let blockRangeTransferService: jest.Mocked<BlockRangeTransferService>;
  let checkpointService: jest.Mocked<CheckpointService>;
  let runBackfillService: RunBackfillService;

  beforeEach(() => {
    blockRangeTransferService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<BlockRangeTransferService>;

    checkpointService = {
      getLastProcessedBlockNumber: jest.fn(),
      updateLastProcessedBlockNumber: jest.fn(),
      deleteCheckpoint: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    runBackfillService = new RunBackfillService(
      blockRangeTransferService,
      checkpointService,
    );

    blockRangeTransferService.execute.mockResolvedValue({
      logCount: 0,
      decodedTransferEventCount: 0,
      indexedTransferEventCount: 0,
      transactionCount: 0,
    });
  });

  it("체크포인트가 없으면 startBlock부터 endBlock까지 batchSize 단위로 처리해야 한다.", async () => {
    // Given
    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);

    // When
    await runBackfillService.execute(1n, 10n, 3);

    // Then
    expect(blockRangeTransferService.execute).toHaveBeenCalledTimes(4);
    expect(blockRangeTransferService.execute).toHaveBeenNthCalledWith(
      1,
      1n,
      3n,
    );
    expect(blockRangeTransferService.execute).toHaveBeenNthCalledWith(
      2,
      4n,
      6n,
    );
    expect(blockRangeTransferService.execute).toHaveBeenNthCalledWith(
      3,
      7n,
      9n,
    );
    expect(blockRangeTransferService.execute).toHaveBeenNthCalledWith(
      4,
      10n,
      10n,
    );

    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledTimes(4);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenNthCalledWith(1, 3n, CheckpointType.BACKFILL);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenNthCalledWith(4, 10n, CheckpointType.BACKFILL);
  });

  it("체크포인트가 startBlock 이상이면 checkpoint 다음 블록부터 처리해야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      5n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(checkpoint);

    // When
    await runBackfillService.execute(1n, 10n, 3);

    // Then
    expect(blockRangeTransferService.execute).toHaveBeenCalledTimes(2);
    expect(blockRangeTransferService.execute).toHaveBeenNthCalledWith(
      1,
      6n,
      8n,
    );
    expect(blockRangeTransferService.execute).toHaveBeenNthCalledWith(
      2,
      9n,
      10n,
    );

    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledTimes(2);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenNthCalledWith(1, 8n, CheckpointType.BACKFILL);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenNthCalledWith(2, 10n, CheckpointType.BACKFILL);
  });

  it("체크포인트가 endBlock 이상이면 아무 작업도 하지 않아야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      10n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(checkpoint);

    // When
    await runBackfillService.execute(1n, 10n, 3);

    // Then
    expect(blockRangeTransferService.execute).not.toHaveBeenCalled();
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).not.toHaveBeenCalled();
  });

  it("startBlock이 음수면 에러가 발생해야 한다.", async () => {
    // Given
    const startBlock = -1n;

    // When & Then
    await expect(
      runBackfillService.execute(startBlock, 10n, 3),
    ).rejects.toThrow("Block number must be >= 0");
  });

  it("endBlock이 음수면 에러가 발생해야 한다.", async () => {
    // Given
    const endBlock = -1n;

    // When & Then
    await expect(runBackfillService.execute(1n, endBlock, 3)).rejects.toThrow(
      "Block number must be >= 0",
    );
  });

  it("startBlock이 endBlock보다 크면 에러가 발생해야 한다.", async () => {
    // Given
    const startBlock = 10n;
    const endBlock = 1n;

    // When & Then
    await expect(
      runBackfillService.execute(startBlock, endBlock, 3),
    ).rejects.toThrow("startBlock must be less than or equal to endBlock");
  });

  it("batchSize가 정수가 아나면 에러가 발생해야 한다.", async () => {
    // Given
    const batchSize = 1.1;

    // When & Then
    await expect(
      runBackfillService.execute(1n, 10n, batchSize),
    ).rejects.toThrow("Batch size must be an integer");
  });

  it("batchSize가 0보다 작으면 에러가 발생해야 한다.", async () => {
    // Given
    const batchSize = -1;

    // When & Then
    await expect(
      runBackfillService.execute(1n, 10n, batchSize),
    ).rejects.toThrow("Batch size must be greater than 0");
  });

  it("배치 처리 중 실패하면 이후 배치와 체크포인트 업데이트를 진행하지 않아야 한다.", async () => {
    // Given
    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);

    blockRangeTransferService.execute
      .mockResolvedValueOnce({
        logCount: 0,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      })
      .mockRejectedValueOnce(new Error("RPC Error"));

    runBackfillService = new RunBackfillService(
      blockRangeTransferService,
      checkpointService,
    );

    // When & Then
    await expect(runBackfillService.execute(1n, 10n, 3)).rejects.toThrow(
      "RPC Error",
    );

    expect(blockRangeTransferService.execute).toHaveBeenCalledTimes(2);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledTimes(1);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledWith(3n, CheckpointType.BACKFILL);
  });
});
