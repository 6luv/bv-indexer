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

  it("지정한 블록 하나를 Transfer 이벤트 인덱싱하고 FORWARDFILL checkpoint를 갱신해야 한다.", async () => {
    // Given
    transferEventService.indexByBlockRange.mockResolvedValue({
      logCount: 2,
      decodedTransferEventCount: 2,
      indexedTransferEventCount: 1,
      transactionCount: 1,
    });

    // When
    await blockBatchProcessor.processForwardfillBlock(100n);

    // Then
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(1);
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledWith(
      100n,
      100n,
    );

    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledTimes(1);
    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledWith(
      100n,
      CheckpointType.FORWARDFILL,
    );
  });

  it("Transfer 이벤트가 없어도 처리한 블록 기준으로 FORWARDFILL checkpoint를 갱신해야 한다.", async () => {
    // Given
    transferEventService.indexByBlockRange.mockResolvedValue({
      logCount: 0,
      decodedTransferEventCount: 0,
      indexedTransferEventCount: 0,
      transactionCount: 0,
    });

    // When
    await blockBatchProcessor.processForwardfillBlock(101n);

    // Then
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledWith(
      101n,
      101n,
    );

    expect(checkpointService.upsertCheckpoint).toHaveBeenCalledWith(
      101n,
      CheckpointType.FORWARDFILL,
    );
  });

  it("Transfer 이벤트 인덱싱 중 실패하면 FORWARDFILL checkpoint를 갱신하지 않아야 한다.", async () => {
    // Given
    transferEventService.indexByBlockRange.mockRejectedValue(
      new Error("RPC Error"),
    );

    // When & Then
    await expect(
      blockBatchProcessor.processForwardfillBlock(102n),
    ).rejects.toThrow("RPC Error");

    expect(transferEventService.indexByBlockRange).toHaveBeenCalledTimes(1);
    expect(transferEventService.indexByBlockRange).toHaveBeenCalledWith(
      102n,
      102n,
    );

    expect(checkpointService.upsertCheckpoint).not.toHaveBeenCalled();
  });
});
