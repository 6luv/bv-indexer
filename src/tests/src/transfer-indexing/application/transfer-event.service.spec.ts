import { TransferEventIndexerService } from "@/transfer-indexing/application/transfer-event-indexer.service";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";
import { Log } from "@/transfer-indexing/domain/model/log";
import { LogReader } from "@/transfer-indexing/domain/protocol/log-reader.protocol";

describe("TransferEventService", () => {
  const tokenAddress = "0x" + "a".repeat(40);
  const txHash = "0x" + "b".repeat(64);
  const topic = "0x" + "d".repeat(64);
  const now = Math.floor(Date.now() / 1000);

  const createLog = (transactionHash = txHash, logIndex = 0): Log => {
    return Log.create(
      tokenAddress,
      [topic],
      "0x" + "0".repeat(63) + "1",
      100n,
      now,
      transactionHash,
      logIndex,
    );
  };

  let logReader: jest.Mocked<LogReader>;
  let transferEventIndexerService: jest.Mocked<TransferEventIndexerService>;
  let transferEventService: TransferEventService;

  beforeEach(() => {
    logReader = {
      getLogsByBlockNumber: jest.fn(),
      getLogsInBlockRange: jest.fn(),
    };

    transferEventIndexerService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<TransferEventIndexerService>;

    transferEventService = new TransferEventService(
      logReader,
      transferEventIndexerService,
    );
  });

  it("특정 블록의 로그를 조회한 뒤 TransferEventIndexer에 전달해야 한다.", async () => {
    // Given
    const blockNumber = 100n;
    const logs = [createLog()];

    logReader.getLogsByBlockNumber.mockResolvedValue(logs);
    transferEventIndexerService.execute.mockResolvedValue({
      logCount: 1,
      decodedTransferEventCount: 1,
      indexedTransferEventCount: 1,
      transactionCount: 1,
    });

    // When
    const result = await transferEventService.indexByBlockNumber(blockNumber);

    // Then
    expect(logReader.getLogsByBlockNumber).toHaveBeenCalledWith(blockNumber);
    expect(transferEventIndexerService.execute).toHaveBeenCalledWith(logs);
    expect(result).toEqual({
      logCount: 1,
      decodedTransferEventCount: 1,
      indexedTransferEventCount: 1,
      transactionCount: 1,
    });
  });

  it("블록 범위의 로그를 조회한 뒤 TransferEventIndexer에 전달해야 한다.", async () => {
    // Given
    const fromBlock = 100n;
    const toBlock = 110n;
    const logs = [createLog()];

    logReader.getLogsInBlockRange.mockResolvedValue(logs);
    transferEventIndexerService.execute.mockResolvedValue({
      logCount: 1,
      decodedTransferEventCount: 1,
      indexedTransferEventCount: 1,
      transactionCount: 1,
    });

    // When
    const result = await transferEventService.indexByBlockRange(
      fromBlock,
      toBlock,
    );

    // Then
    expect(logReader.getLogsInBlockRange).toHaveBeenCalledWith(
      fromBlock,
      toBlock,
    );
    expect(transferEventIndexerService.execute).toHaveBeenCalledWith(logs);
    expect(result).toEqual({
      logCount: 1,
      decodedTransferEventCount: 1,
      indexedTransferEventCount: 1,
      transactionCount: 1,
    });
  });

  it("fromBlock이 toBlock보다 크면 에러가 발생해야 한다.", async () => {
    // Given
    const fromBlock = 110n;
    const toBlock = 100n;

    // When & Then
    await expect(
      transferEventService.indexByBlockRange(fromBlock, toBlock),
    ).rejects.toThrow("fromBlock must be less than or equal to toBlock");

    expect(logReader.getLogsInBlockRange).not.toHaveBeenCalled();
    expect(transferEventIndexerService.execute).not.toHaveBeenCalled();
  });
});
