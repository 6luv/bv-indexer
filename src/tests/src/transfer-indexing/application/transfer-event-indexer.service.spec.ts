import { TransferEventIndexerService } from "@/transfer-indexing/application/transfer-event-indexer.service";
import { Log } from "@/transfer-indexing/domain/model/log";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";
import { TransferEventDecoder } from "@/transfer-indexing/domain/protocol/decoder/transfer-event.decoder";
import { TransactionReader } from "@/transfer-indexing/domain/protocol/transaction-reader.protocol";
import { TransactionRepository } from "@/transfer-indexing/domain/repository/transaction.repository";
import { TransferEventRepository } from "@/transfer-indexing/domain/repository/transfer-event.repository";

describe("TransferEventIndexerService", () => {
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

  let transferEventDecoder: jest.Mocked<TransferEventDecoder>;
  let transactionReader: jest.Mocked<TransactionReader>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transferEventRepository: jest.Mocked<TransferEventRepository>;
  let transferEventIndexerService: TransferEventIndexerService;

  beforeEach(() => {
    transferEventDecoder = {
      decode: jest.fn(),
    } as unknown as jest.Mocked<TransferEventDecoder>;

    transactionReader = {
      getTransaction: jest.fn(),
      getTransactionsByHashes: jest.fn(),
    } as unknown as jest.Mocked<TransactionReader>;

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

    transferEventIndexerService = new TransferEventIndexerService(
      transferEventDecoder,
      transactionReader,
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
    transactionReader.getTransactionsByHashes.mockResolvedValue([transaction]);
    transactionRepository.existsByHash.mockResolvedValue(false);
    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      false,
    );

    // When
    const result = await transferEventIndexerService.execute([log]);

    // Then
    expect(transferEventDecoder.decode).toHaveBeenCalledWith(log);

    expect(transactionReader.getTransactionsByHashes).toHaveBeenCalledWith([
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
    transactionReader.getTransactionsByHashes.mockResolvedValue([]);

    // When
    const result = await transferEventIndexerService.execute([log]);

    // Then
    expect(transferEventDecoder.decode).toHaveBeenCalledWith(log);
    expect(transactionReader.getTransactionsByHashes).toHaveBeenCalledWith([]);
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
    transactionReader.getTransactionsByHashes.mockResolvedValue([]);

    // When
    const result = await transferEventIndexerService.execute([log]);

    // Then
    expect(transactionReader.getTransactionsByHashes).toHaveBeenCalledWith([]);
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
    transactionReader.getTransactionsByHashes.mockResolvedValue([transaction]);
    transactionRepository.existsByHash.mockResolvedValue(true);
    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      false,
    );

    // When
    await transferEventIndexerService.execute([log]);

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
    transactionReader.getTransactionsByHashes.mockResolvedValue([transaction]);
    transactionRepository.existsByHash.mockResolvedValue(false);
    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      true,
    );

    // When
    await transferEventIndexerService.execute([log]);

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

    transactionReader.getTransactionsByHashes.mockResolvedValue([transaction]);
    transactionRepository.existsByHash.mockResolvedValue(false);
    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      false,
    );

    // When
    const result = await transferEventIndexerService.execute([log1, log2]);

    // Then
    expect(transactionReader.getTransactionsByHashes).toHaveBeenCalledWith([
      txHash,
    ]);
    expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledTimes(2);

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
    transactionReader.getTransactionsByHashes.mockResolvedValue([transaction]);
    transactionRepository.existsByHash.mockResolvedValue(false);
    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      false,
    );

    // When
    const result = await transferEventIndexerService.execute([log]);

    // Then
    expect(result.indexedTransferEventCount).toBe(1);
    expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledWith(
      transferEvent,
    );
  });

  it("로그가 비어 있으면 아무것도 저장하지 않고 count는 0이어야 한다.", async () => {
    // Given
    transactionReader.getTransactionsByHashes.mockResolvedValue([]);

    // When
    const result = await transferEventIndexerService.execute([]);

    // Then
    expect(transferEventDecoder.decode).not.toHaveBeenCalled();
    expect(transactionReader.getTransactionsByHashes).toHaveBeenCalledWith([]);
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
