import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { BlockBatchProcessor } from "@/sync/application/block-batch-processor.service";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";

describe("BlockBatchProcessor", () => {
  let transferEventService: jest.Mocked<TransferEventService>;
  let checkpointService: jest.Mocked<CheckpointService>;
  let blockBatchProcessor: BlockBatchProcessor;

  beforeEach(() => {
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

  it("배치 목록을 concurrency 단위로 병렬 처리하고 chunk마다 체크포인트를 갱신해야 한다.", async () => {
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
    await blockBatchProcessor.processAllBackfill(batches);

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
    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledTimes(2);
    expect(checkpointService.upsertCheckpoint).toHaveBeenNthCalledWith(
      1,
      9n,
      CheckpointType.BACKFILL,
    );
    expect(checkpointService.upsertCheckpoint).toHaveBeenNthCalledWith(
      2,
      10n,
      CheckpointType.BACKFILL,
    );
  });

  it("chunk 처리 중 하나라도 실패하면 해당 chunk의 체크포인트를 갱신하지 않아야 한다.", async () => {
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
      .mockRejectedValueOnce(new Error("RPC Error"))
      .mockResolvedValueOnce({
        logCount: 0,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      });

    // When & Then
    await expect(
      blockBatchProcessor.processAllBackfill(batches),
    ).rejects.toThrow("RPC Error");
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(3);
    expect(checkpointService.upsertCheckpoint).not.toHaveBeenCalled();
  });

  it("concurrency 개수만큼 배치를 병렬로 시작해야 한다.", async () => {
    // Given
    const batches = [
      { fromBlock: 1n, toBlock: 3n },
      { fromBlock: 4n, toBlock: 6n },
      { fromBlock: 7n, toBlock: 9n },
      { fromBlock: 10n, toBlock: 12n },
    ];

    const result = {
      logCount: 0,
      decodedTransferEventCount: 0,
      indexedTransferEventCount: 0,
      transactionCount: 0,
    };

    let resolveFirst!: (value: typeof result) => void;

    const firstPromise = new Promise<typeof result>((resolve) => {
      resolveFirst = resolve;
    });

    transferEventService.indexByBlockRange
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(result)
      .mockResolvedValueOnce(result)
      .mockResolvedValueOnce(result);

    // When
    const promise = blockBatchProcessor.processAllBackfill(batches, 3);

    // Then
    // 첫 번째 배치가 아직 끝나지 않았는데도 concurrency=3만큼 호출되어야 함
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(3);
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

    // 첫 번째 chunk가 끝나기 전에는 4번째 배치는 시작되면 안 됨
    expect(transferEventService.indexByBlockRange).not.toHaveBeenCalledWith(
      10n,
      12n,
    );

    // 첫 번째 배치를 완료시켜서 첫 chunk 전체가 끝나게 함
    resolveFirst(result);
    await promise;
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(4);
    expect(checkpointService.upsertCheckpoint).toHaveBeenNthCalledWith(
      1,
      9n,
      CheckpointType.BACKFILL,
    );
    expect(checkpointService.upsertCheckpoint).toHaveBeenNthCalledWith(
      2,
      12n,
      CheckpointType.BACKFILL,
    );
  });
});
