import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { BlockRangeTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { BlockBatchProcessor } from "@/sync/application/block-batch-processor.service";

describe("BlockBatchProcessor", () => {
  let blockRangeTransferService: jest.Mocked<BlockRangeTransferService>;
  let checkpointService: jest.Mocked<CheckpointService>;
  let blockBatchProcessor: BlockBatchProcessor;

  beforeEach(() => {
    blockRangeTransferService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<BlockRangeTransferService>;

    checkpointService = {
      updateLastProcessedBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    blockRangeTransferService.execute.mockResolvedValue({
      logCount: 0,
      decodedTransferEventCount: 0,
      indexedTransferEventCount: 0,
      transactionCount: 0,
    });

    blockBatchProcessor = new BlockBatchProcessor(
      blockRangeTransferService,
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

    // When
    await blockBatchProcessor.processAll(batches);

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

  it("배치 처리 중 실패하면 이후 배치와 체크포인트 업데이트를 진행하지 않아야 한다.", async () => {
    // Given
    const batches = [
      { fromBlock: 1n, toBlock: 3n },
      { fromBlock: 4n, toBlock: 6n },
      { fromBlock: 7n, toBlock: 9n },
    ];

    blockRangeTransferService.execute
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

    expect(blockRangeTransferService.execute).toHaveBeenCalledTimes(2);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledTimes(1);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledWith(3n, CheckpointType.BACKFILL);
  });
});
