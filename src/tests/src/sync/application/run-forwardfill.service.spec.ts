import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";
import { RunForwardfillService } from "@/sync/application/run-forwardfill.service";
import { BlockReader } from "@/sync/domain/protocol/block-reader.protocol";
import { BlockBatchProcessor } from "@/sync/application/block-batch-processor.service";

describe("RunForwardfillService", () => {
  let blockReader: jest.Mocked<BlockReader>;
  let checkpointService: jest.Mocked<CheckpointService>;
  let runForwardfillService: RunForwardfillService;
  let blockBatchProcessor: jest.Mocked<BlockBatchProcessor>;

  beforeEach(() => {
    blockReader = {
      getLatestBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<BlockReader>;

    checkpointService = {
      getCheckpointByType: jest.fn(),
      upsertCheckpoint: jest.fn(),
      deleteCheckpoint: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    blockBatchProcessor = {
      processForwardfillBlock: jest.fn(),
    } as unknown as jest.Mocked<BlockBatchProcessor>;

    runForwardfillService = new RunForwardfillService(
      blockReader,
      checkpointService,
      10_000,
      blockBatchProcessor,
    );
  });

  it("체크포인트가 없으면 최신 블록부터 Forwardfill을 시작해야 한다.", async () => {
    // Given
    checkpointService.getCheckpointByType.mockResolvedValue(null);
    blockReader.getLatestBlockNumber.mockResolvedValue(100n);

    blockBatchProcessor.processForwardfillBlock.mockImplementation(async () => {
      runForwardfillService.stop();
    });

    // When
    await runForwardfillService.runForwardfill();

    // Then
    expect(checkpointService.getCheckpointByType).toHaveBeenCalledWith(
      CheckpointType.FORWARDFILL,
    );
    expect(blockReader.getLatestBlockNumber).toHaveBeenCalled();
    expect(blockBatchProcessor.processForwardfillBlock).toHaveBeenCalledWith(
      100n,
    );
  });

  // it("체크포인트가 있으면 마지막 처리 블록 다음부터 처리해야 한다.", async () => {});

  it("처리할 새 블록이 없으면 BlockBatchProcessor를 호출하지 않아야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.FORWARDFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getCheckpointByType.mockResolvedValue(checkpoint);

    blockReader.getLatestBlockNumber.mockImplementation(async () => {
      runForwardfillService.stop();
      return 100n;
    });

    // When
    await runForwardfillService.runForwardfill();

    // Then
    expect(blockBatchProcessor.processForwardfillBlock).not.toHaveBeenCalled();
  });

  it("stop이 호출되면 중단해야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.FORWARDFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getCheckpointByType.mockResolvedValue(checkpoint);
    blockReader.getLatestBlockNumber.mockResolvedValue(105n);

    blockBatchProcessor.processForwardfillBlock.mockImplementation(async () => {
      runForwardfillService.stop();
    });

    // When
    await runForwardfillService.runForwardfill();

    // Then
    expect(blockBatchProcessor.processForwardfillBlock).toHaveBeenCalledTimes(
      1,
    );
    expect(blockBatchProcessor.processForwardfillBlock).toHaveBeenCalledWith(
      101n,
    );
  });
});
