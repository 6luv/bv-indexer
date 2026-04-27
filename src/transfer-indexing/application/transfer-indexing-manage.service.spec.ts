import { Log } from "../domain/model/log";
import { Transaction } from "../domain/model/transaction";
import { TransferEvent } from "../domain/model/transfer-event";
import { TransactionRepository } from "../domain/repository/transaction.repository";
import { TransferEventRepository } from "../domain/repository/transfer-event.repository";
import { TransferEventDecoder } from "./decoder/transfer-event.decoder";
import { LogRpcPort } from "./port/log-rpc.port";
import { TransactionRpcPort } from "./port/transaction-rpc.port";
import {
  BlockRangeTransferService,
  BlockTransferService,
  LogTransferService,
} from "./transfer-indexing-manage.service";

describe("TransferIndexingManageService", () => {
  const targetWalletAddress = "0x" + "1".repeat(40);
  const otherWalletAddress = "0x" + "2".repeat(40);
  const tokenAddress = "0x" + "a".repeat(40);

  const txHash = "0x" + "b".repeat(64);
  const blockHash = "0x" + "c".repeat(64);

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

  const createTransferEvent = (
    from = targetWalletAddress,
    to = otherWalletAddress,
    transactionHash = txHash,
    logIndex = 0,
  ): TransferEvent => {
    return TransferEvent.create(
      tokenAddress,
      from,
      to,
      100n,
      100n,
      now,
      transactionHash,
      logIndex,
    );
  };

  const createTransaction = (hash = txHash): Transaction => {
    return Transaction.create(
      hash,
      targetWalletAddress,
      otherWalletAddress,
      100n,
      blockHash,
      100n,
      now,
    );
  };

  describe("BlockTransferService", () => {
    let logRpcPort: jest.Mocked<LogRpcPort>;
    let logTransferService: jest.Mocked<LogTransferService>;
    let blockTransferService: BlockTransferService;

    beforeEach(() => {
      logRpcPort = {
        getLogsByBlockNumber: jest.fn(),
        getLogsInBlockRange: jest.fn(),
      };

      logTransferService = {
        execute: jest.fn(),
      } as unknown as jest.Mocked<LogTransferService>;

      blockTransferService = new BlockTransferService(
        logRpcPort,
        logTransferService,
      );
    });

    it("특정 블록의 로그를 조회한 뒤 LogTransferService에 전달해야 한다.", async () => {
      // Given
      const blockNumber = 100n;
      const logs = [createLog()];

      logRpcPort.getLogsByBlockNumber.mockResolvedValue(logs);
      logTransferService.execute.mockResolvedValue({
        logCount: 1,
        decodedTransferEventCount: 1,
        indexedTransferEventCount: 1,
        transactionCount: 1,
      });

      // When
      const result = await blockTransferService.execute(blockNumber);

      // Then
      expect(logRpcPort.getLogsByBlockNumber).toHaveBeenCalledWith(blockNumber);
      expect(logTransferService.execute).toHaveBeenCalledWith(logs);
      expect(result).toEqual({
        logCount: 1,
        decodedTransferEventCount: 1,
        indexedTransferEventCount: 1,
        transactionCount: 1,
      });
    });
  });

  describe("BlockRangeTransferService", () => {
    let logRpcPort: jest.Mocked<LogRpcPort>;
    let logTransferService: jest.Mocked<LogTransferService>;
    let blockRangeTransferService: BlockRangeTransferService;

    beforeEach(() => {
      logRpcPort = {
        getLogsByBlockNumber: jest.fn(),
        getLogsInBlockRange: jest.fn(),
      };

      logTransferService = {
        execute: jest.fn(),
      } as unknown as jest.Mocked<LogTransferService>;

      blockRangeTransferService = new BlockRangeTransferService(
        logRpcPort,
        logTransferService,
      );
    });

    it("블록 범위의 로그를 조회한 뒤 LogTransferService에 전달해야 한다.", async () => {
      // Given
      const fromBlock = 100n;
      const toBlock = 110n;
      const logs = [createLog()];

      logRpcPort.getLogsInBlockRange.mockResolvedValue(logs);
      logTransferService.execute.mockResolvedValue({
        logCount: 1,
        decodedTransferEventCount: 1,
        indexedTransferEventCount: 1,
        transactionCount: 1,
      });

      // When
      const result = await blockRangeTransferService.execute(
        fromBlock,
        toBlock,
      );

      // Then
      expect(logRpcPort.getLogsInBlockRange).toHaveBeenCalledWith(
        fromBlock,
        toBlock,
      );
      expect(logTransferService.execute).toHaveBeenCalledWith(logs);
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
        blockRangeTransferService.execute(fromBlock, toBlock),
      ).rejects.toThrow("fromBlock must be less than or equal to toBlock");
      expect(logRpcPort.getLogsInBlockRange).not.toHaveBeenCalled();
      expect(logTransferService.execute).not.toHaveBeenCalled();
    });
  });

  describe("LogTransferService", () => {
    let transferEventDecoder: jest.Mocked<TransferEventDecoder>;
    let transactionRpcPort: jest.Mocked<TransactionRpcPort>;
    let transactionRepository: jest.Mocked<TransactionRepository>;
    let transferEventRepository: jest.Mocked<TransferEventRepository>;
    let logTransferService: LogTransferService;

    beforeEach(() => {
      transferEventDecoder = {
        decode: jest.fn(),
      } as unknown as jest.Mocked<TransferEventDecoder>;

      transactionRpcPort = {
        getTransaction: jest.fn(),
        getTransactionsByHashes: jest.fn(),
      } as unknown as jest.Mocked<TransactionRpcPort>;

      transactionRepository = {
        save: jest.fn(),
        existsByHash: jest.fn(),
        saveTransaction: jest.fn(),
      } as unknown as jest.Mocked<TransactionRepository>;

      transferEventRepository = {
        save: jest.fn(),
        existsByTransactionHashAndLogIndex: jest.fn(),
        saveTransferEvent: jest.fn(),
      } as unknown as jest.Mocked<TransferEventRepository>;

      logTransferService = new LogTransferService(
        transferEventDecoder,
        transactionRpcPort,
        transactionRepository,
        transferEventRepository,
        targetWalletAddress,
      );
    });

    it("로그를 디코딩하고 targetWalletAddress와 관련된 TransferEvent만 저장해야 한다.", async () => {
      // Given
      const log = createLog();
      const transferEvent = createTransferEvent();
      const transaction = createTransaction();

      transferEventDecoder.decode.mockResolvedValue(transferEvent);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([
        transaction,
      ]);
      transactionRepository.existsByHash.mockResolvedValue(false);
      transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
        false,
      );

      // When
      const result = await logTransferService.execute([log]);

      // Then
      expect(transferEventDecoder.decode).toHaveBeenCalledWith(log);

      expect(transactionRpcPort.getTransactionsByHashes).toHaveBeenCalledWith([
        txHash,
      ]);
      expect(transactionRepository.existsByHash).toHaveBeenCalledWith(txHash);
      expect(transactionRepository.saveTransaction).toHaveBeenCalledWith(
        transaction,
      );

      expect(
        transferEventRepository.existsByTransactionHashAndLogIndex,
      ).toHaveBeenCalledWith(txHash, 0);
      expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledWith(
        transferEvent,
      );

      expect(result).toEqual({
        logCount: 1,
        decodedTransferEventCount: 1,
        indexedTransferEventCount: 1,
        transactionCount: 1,
      });
    });

    it("decoder가 null을 반환하면 저장하지 않아야 한다.", async () => {
      // Given
      const log = createLog();

      transferEventDecoder.decode.mockResolvedValue(null);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([]);

      // When
      const result = await logTransferService.execute([log]);

      // Then
      expect(transferEventDecoder.decode).toHaveBeenCalledWith(log);
      expect(transactionRpcPort.getTransactionsByHashes).toHaveBeenCalledWith(
        [],
      );
      expect(transactionRepository.saveTransaction).not.toHaveBeenCalled();
      expect(transferEventRepository.saveTransferEvent).not.toHaveBeenCalled();

      expect(result).toEqual({
        logCount: 1,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      });
    });

    it("targetWalletAddress와 관련 없는 TransferEvent는 저장하지 않아야 한다.", async () => {
      // Given
      const log = createLog();
      const unrelatedTransferEvent = createTransferEvent(
        "0x" + "3".repeat(40),
        "0x" + "4".repeat(40),
      );

      transferEventDecoder.decode.mockResolvedValue(unrelatedTransferEvent);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([]);

      // When
      const result = await logTransferService.execute([log]);

      // Then
      expect(transactionRpcPort.getTransactionsByHashes).toHaveBeenCalledWith(
        [],
      );
      expect(transactionRepository.saveTransaction).not.toHaveBeenCalled();
      expect(transferEventRepository.saveTransferEvent).not.toHaveBeenCalled();

      expect(result).toEqual({
        logCount: 1,
        decodedTransferEventCount: 1,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      });
    });

    it("이미 저장된 Transaction은 다시 저장되지 않아야 한다.", async () => {
      // Given
      const log = createLog();
      const transferEvent = createTransferEvent();
      const transaction = createTransaction();

      transferEventDecoder.decode.mockResolvedValue(transferEvent);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([
        transaction,
      ]);
      transactionRepository.existsByHash.mockResolvedValue(true);
      transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
        false,
      );

      // When
      await logTransferService.execute([log]);

      // Then
      expect(transactionRepository.existsByHash).toHaveBeenCalledWith(txHash);
      expect(transactionRepository.saveTransaction).not.toHaveBeenCalled();

      expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledWith(
        transferEvent,
      );
    });

    it("이미 저장된 TransferEvent는 다시 저장되지 않아야 한다.", async () => {
      // Given
      const log = createLog();
      const transferEvent = createTransferEvent();
      const transaction = createTransaction();

      transferEventDecoder.decode.mockResolvedValue(transferEvent);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([
        transaction,
      ]);
      transactionRepository.existsByHash.mockResolvedValue(false);
      transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
        true,
      );

      // When
      await logTransferService.execute([log]);

      // Then
      expect(transactionRepository.saveTransaction).toHaveBeenCalledWith(
        transaction,
      );
      expect(transferEventRepository.saveTransferEvent).not.toHaveBeenCalled();
    });

    it("같은 transactionHash를 가진 TransferEvent가 여러 개 있어도 transaction은 한 번만 조회해야 한다.", async () => {
      // Given
      const log1 = createLog(txHash, 0);
      const log2 = createLog(txHash, 1);

      const transferEvent1 = createTransferEvent(
        targetWalletAddress,
        otherWalletAddress,
        txHash,
        0,
      );

      const transferEvent2 = createTransferEvent(
        otherWalletAddress,
        targetWalletAddress,
        txHash,
        1,
      );

      const transaction = createTransaction(txHash);
      transferEventDecoder.decode
        .mockResolvedValueOnce(transferEvent1)
        .mockResolvedValueOnce(transferEvent2);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([
        transaction,
      ]);
      transactionRepository.existsByHash.mockResolvedValue(false);
      transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
        false,
      );

      // When
      const result = await logTransferService.execute([log1, log2]);

      // Then
      expect(transactionRpcPort.getTransactionsByHashes).toHaveBeenCalledWith([
        txHash,
      ]);
      expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledTimes(
        2,
      );

      expect(result).toEqual({
        logCount: 2,
        decodedTransferEventCount: 2,
        indexedTransferEventCount: 2,
        transactionCount: 1,
      });
    });

    it("targetWalletAddress 주소 비교는 대소문자를 구분하지 않아야 한다.", async () => {
      // Given
      const log = createLog();
      const upperCaseTarget = "0x" + targetWalletAddress.slice(2).toUpperCase();
      const transferEvent = createTransferEvent(
        upperCaseTarget,
        otherWalletAddress,
      );
      const transaction = createTransaction();

      transferEventDecoder.decode.mockResolvedValue(transferEvent);
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([
        transaction,
      ]);
      transactionRepository.existsByHash.mockResolvedValue(false);
      transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
        false,
      );

      // When
      const result = await logTransferService.execute([log]);

      // Then
      expect(result.indexedTransferEventCount).toBe(1);
      expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledWith(
        transferEvent,
      );
    });

    it("로그가 비어 있으면 아무것도 저장하지 않고 count는 0이어야 한다.", async () => {
      // Given
      transactionRpcPort.getTransactionsByHashes.mockResolvedValue([]);

      // When
      const result = await logTransferService.execute([]);

      // Then
      expect(transferEventDecoder.decode).not.toHaveBeenCalled();
      expect(transactionRpcPort.getTransactionsByHashes).toHaveBeenCalledWith(
        [],
      );
      expect(transactionRepository.saveTransaction).not.toHaveBeenCalled();
      expect(transferEventRepository.saveTransferEvent).not.toHaveBeenCalled();

      expect(result).toEqual({
        logCount: 0,
        decodedTransferEventCount: 0,
        indexedTransferEventCount: 0,
        transactionCount: 0,
      });
    });
  });
});
