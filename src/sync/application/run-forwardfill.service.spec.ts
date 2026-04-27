import { BlockTransferService } from "@/transfer-indexing/application/transfer-indexing-manage.service";
import { BlockRpcPort } from "./port/block-rpc.port";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { RunForwardfillService } from "./run-forwardfill.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";

describe("RunForwardfillService", () => {
  let blockRpcPort: jest.Mocked<BlockRpcPort>;
  let blockTransferService: jest.Mocked<BlockTransferService>;
  let checkpointService: jest.Mocked<CheckpointService>;
  let runForwardfillService: RunForwardfillService;

  beforeEach(() => {
    blockRpcPort = {
      getLatestBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<BlockRpcPort>;

    blockTransferService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<BlockTransferService>;

    checkpointService = {
      getLastProcessedBlockNumber: jest.fn(),
      updateLastProcessedBlockNumber: jest.fn(),
      deleteCheckpoint: jest.fn(),
    } as unknown as jest.Mocked<CheckpointService>;

    runForwardfillService = new RunForwardfillService(
      blockRpcPort,
      blockTransferService,
      checkpointService,
      10_000,
    );
  });

  it("체크포인트가 없으면 최신 블록부터 Forwardfill을 시작해야 한다.", async () => {
    // Given
    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(null);
    blockRpcPort.getLatestBlockNumber.mockResolvedValue(100n);
    blockTransferService.execute.mockImplementation(async () => {
      runForwardfillService.stop();
      return {
        logCount: 0,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      };
    });

    // When
    await runForwardfillService.execute();

    // Then
    expect(checkpointService.getLastProcessedBlockNumber).toHaveBeenCalledWith(
      CheckpointType.FORWARDFILL,
    );
    expect(blockRpcPort.getLatestBlockNumber).toHaveBeenCalled();
    expect(blockTransferService.execute).toHaveBeenCalledWith(100n);

    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledWith(100n, CheckpointType.FORWARDFILL);
  });

  // it("체크포인트가 있으면 마지막 처리 블록 다음부터 처리해야 한다.", async () => {});

  it("처리할 새 블록이 없으면 BlockTransferService를 호출하지 않아야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.FORWARDFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(checkpoint);
    blockRpcPort.getLatestBlockNumber.mockImplementation(async () => {
      runForwardfillService.stop();
      return 100n;
    });

    // When
    await runForwardfillService.execute();

    // Then
    expect(blockTransferService.execute).not.toHaveBeenCalled();
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).not.toHaveBeenCalled();
  });

  it("stop이 호출되면 중단해야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.FORWARDFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(checkpoint);
    blockRpcPort.getLatestBlockNumber.mockResolvedValue(105n);
    blockTransferService.execute.mockImplementation(async () => {
      runForwardfillService.stop();
      return {
        logCount: 0,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      };
    });

    // When
    await runForwardfillService.execute();

    // Then
    expect(blockTransferService.execute).toHaveBeenCalledTimes(1);
    expect(blockTransferService.execute).toHaveBeenCalledWith(101n);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledTimes(1);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).toHaveBeenCalledWith(101n, CheckpointType.FORWARDFILL);
  });

  it("블록 처리 중 에러가 발생하면 체크포인트를 갱신하지 않아야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.FORWARDFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointService.getLastProcessedBlockNumber.mockResolvedValue(checkpoint);
    blockRpcPort.getLatestBlockNumber.mockResolvedValue(101n);
    blockTransferService.execute.mockRejectedValue(
      new Error("Block process failed"),
    );

    // When & Then
    await expect(runForwardfillService.execute()).rejects.toThrow(
      "Block process failed",
    );

    expect(blockTransferService.execute).toHaveBeenCalledWith(101n);
    expect(
      checkpointService.updateLastProcessedBlockNumber,
    ).not.toHaveBeenCalled();
  });
});
