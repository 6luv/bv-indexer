import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { BlockBatchProcessor } from "@/sync/application/block-batch-processor.service";
import { TransferEventIndexerService } from "@/transfer-indexing/application/transfer-event-indexer.service";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";

describe("BlockBatchProcessor", () => {
  let transferEventIndexerService: jest.Mocked<TransferEventIndexerService>;
  let transferEventService: jest.Mocked<TransferEventService>;
  let checkpointService: jest.Mocked<CheckpointService>;
  let blockBatchProcessor: BlockBatchProcessor;

  beforeEach(() => {
    transferEventIndexerService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<TransferEventIndexerService>;

    transferEventService = {
      indexByBlockRange: jest.fn(),
      indexByBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<TransferEventService>;

    checkpointService = {
      upsertCheckpoint: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    blockBatchProcessor = new BlockBatchProcessor(
      transferEventService,
      checkpointService,
    );
  });

  it("배치 목록을 순차적으로 처리하고 각 배치마다 체크포인트를 갱신해야 한다.", async () => {
    // Given
    const batches = [
      { fromBlock: 1n, toBlock: 3n },
      { fromBlock: 4n, toBlock: 6n },
      { fromBlock: 7n, toBlock: 9n },
      { fromBlock: 10n, toBlock: 10n },
    ];

    transferEventService.indexByBlockRange.mockResolvedValue({
      logCount: 0,
      decodedTransferEventCount: 0,
      indexedTransferEventCount: 0,
      transactionCount: 0,
    });

    // When
    await blockBatchProcessor.processAll(batches);

    // Then
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(4);
    expect(transferEventService.indexByBlockRange).toHaveBeenNthCalledWith(
      1,
      1n,
      3n,
    );
    expect(transferEventService.indexByBlockRange).toHaveBeenNthCalledWith(
      2,
      4n,
      6n,
    );
    expect(transferEventService.indexByBlockRange).toHaveBeenNthCalledWith(
      3,
      7n,
      9n,
    );
    expect(transferEventService.indexByBlockRange).toHaveBeenNthCalledWith(
      4,
      10n,
      10n,
    );

    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledTimes(4);
    expect(checkpointService.upsertCheckpoint).toHaveBeenNthCalledWith(
      1,
      3n,
      CheckpointType.BACKFILL,
    );
    expect(checkpointService.upsertCheckpoint).toHaveBeenNthCalledWith(
      4,
      10n,
      CheckpointType.BACKFILL,
    );
  });

  it("배치 처리 중 실패하면 이후 배치와 체크포인트 업데이트를 진행하지 않아야 한다.", async () => {
    // Given
    const batches = [
      { fromBlock: 1n, toBlock: 3n },
      { fromBlock: 4n, toBlock: 6n },
      { fromBlock: 7n, toBlock: 9n },
    ];

    transferEventService.indexByBlockRange
      .mockResolvedValueOnce({
        logCount: 0,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      })
      .mockRejectedValueOnce(new Error("RPC Error"));

    // When & Then
    await expect(blockBatchProcessor.processAll(batches)).rejects.toThrow(
      "RPC Error",
    );

    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(2);
    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledTimes(1);
    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledWith(
      3n,
      CheckpointType.BACKFILL,
    );
  });
});
