import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";
import { RunBackfillService } from "@/sync/application/run-backfill.service";
import { BlockBatchProcessor } from "@/sync/application/block-batch-processor.service";

describe("RunBackfillService", () => {
  let checkpointService: jest.Mocked<CheckpointService>;
  let runBackfillService: RunBackfillService;
  let blockBatchProcessor: jest.Mocked<BlockBatchProcessor>;

  beforeEach(() => {
    checkpointService = {
      getLastProcessedBlockNumber: jest.fn(),
      updateLastProcessedBlockNumber: jest.fn(),
      deleteCheckpoint: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    blockBatchProcessor = {
      processAll: jest.fn(),
      process: jest.fn(),
    } as unknown as jest.Mocked<BlockBatchProcessor>;

    runBackfillService = new RunBackfillService(
      checkpointService,
      blockBatchProcessor,
    );
  });

  it("체크포인트가 없으면 startBlock부터 endBlock까지 batchSize 단위로 배치를 생성해 처리해야 한다.", async () => {
    // Given
    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);

    // When
    await runBackfillService.runBackfill(1n, 10n, 3);

    // Then
    expect(blockBatchProcessor.processAll).toHaveBeenCalledTimes(1);
    expect(blockBatchProcessor.processAll).toHaveBeenCalledWith([
      { fromBlock: 1n, toBlock: 3n },
      { fromBlock: 4n, toBlock: 6n },
      { fromBlock: 7n, toBlock: 9n },
      { fromBlock: 10n, toBlock: 10n },
    ]);
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
    await runBackfillService.runBackfill(1n, 10n, 3);

    // Then
    expect(blockBatchProcessor.processAll).toHaveBeenCalledTimes(1);
    expect(blockBatchProcessor.processAll).toHaveBeenCalledWith([
      { fromBlock: 6n, toBlock: 8n },
      { fromBlock: 9n, toBlock: 10n },
    ]);
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
    await runBackfillService.runBackfill(1n, 10n, 3);

    // Then
    expect(blockBatchProcessor.processAll).not.toHaveBeenCalled();
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).not.toHaveBeenCalled();
  });

  it("startBlock이 음수면 에러가 발생해야 한다.", async () => {
    // Given
    const startBlock = -1n;

    // When & Then
    await expect(
      runBackfillService.runBackfill(startBlock, 10n, 3),
    ).rejects.toThrow("Block number must be >= 0");
  });

  it("endBlock이 음수면 에러가 발생해야 한다.", async () => {
    // Given
    const endBlock = -1n;

    // When & Then
    await expect(
      runBackfillService.runBackfill(1n, endBlock, 3),
    ).rejects.toThrow("Block number must be >= 0");
  });

  it("startBlock이 endBlock보다 크면 에러가 발생해야 한다.", async () => {
    // Given
    const startBlock = 10n;
    const endBlock = 1n;

    // When & Then
    await expect(
      runBackfillService.runBackfill(startBlock, endBlock, 3),
    ).rejects.toThrow("startBlock must be less than or equal to endBlock");
  });

  it("batchSize가 정수가 아나면 에러가 발생해야 한다.", async () => {
    // Given
    const batchSize = 1.1;

    // When & Then
    await expect(
      runBackfillService.runBackfill(1n, 10n, batchSize),
    ).rejects.toThrow("Batch size must be an integer");
  });

  it("batchSize가 0보다 작으면 에러가 발생해야 한다.", async () => {
    // Given
    const batchSize = -1;

    // When & Then
    await expect(
      runBackfillService.runBackfill(1n, 10n, batchSize),
    ).rejects.toThrow("Batch size must be greater than 0");
  });
});
