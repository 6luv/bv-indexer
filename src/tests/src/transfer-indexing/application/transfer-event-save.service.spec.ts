import { TransferEventSaveService } from "@/transfer-indexing/application/transfer-event-save.service";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";
import { TransactionRepository } from "@/transfer-indexing/domain/repository/transaction.repository";
import { TransferEventRepository } from "@/transfer-indexing/domain/repository/transfer-event.repository";

describe("TransferEventSaveService", () => {
  const targetWalletAddress = "0x" + "1".repeat(40);
  const otherWalletAddress = "0x" + "2".repeat(40);
  const tokenAddress = "0x" + "a".repeat(40);

  const txHash = "0x" + "b".repeat(64);
  const blockHash = "0x" + "c".repeat(64);
  const now = Math.floor(Date.now() / 1000);

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

  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transferEventRepository: jest.Mocked<TransferEventRepository>;
  let transferEventSaveService: TransferEventSaveService;

  beforeEach(() => {
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

    transferEventSaveService = new TransferEventSaveService(
      transactionRepository,
      transferEventRepository,
    );
  });

  it("저장되지 않은 Transaction은 저장해야 한다.", async () => {
    // Given
    const transaction = createTransaction();

    transactionRepository.existsByHash.mockResolvedValue(false);

    // When
    await transferEventSaveService.saveTransactionsIfAbsent([transaction]);

    // Then
    expect(transactionRepository.existsByHash).toHaveBeenCalledWith(txHash);
    expect(transactionRepository.saveTransaction).toHaveBeenCalledWith(
      transaction,
    );
  });

  it("이미 저장된 Transaction은 다시 저장하지 않아야 한다.", async () => {
    // Given
    const transaction = createTransaction();

    transactionRepository.existsByHash.mockResolvedValue(true);

    // When
    await transferEventSaveService.saveTransactionsIfAbsent([transaction]);

    // Then
    expect(transactionRepository.existsByHash).toHaveBeenCalledWith(txHash);
    expect(transactionRepository.saveTransaction).not.toHaveBeenCalled();
  });

  it("저장되지 않은 TransferEvent는 저장해야 한다.", async () => {
    // Given
    const transferEvent = createTransferEvent();

    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      false,
    );

    // When
    await transferEventSaveService.saveTransferEventsIfAbsent([transferEvent]);

    // Then
    expect(
      transferEventRepository.existsByTransactionHashAndLogIndex,
    ).toHaveBeenCalledWith(txHash, 0);
    expect(transferEventRepository.saveTransferEvent).toHaveBeenCalledWith(
      transferEvent,
    );
  });

  it("이미 저장된 TransferEvent는 다시 저장하지 않아야 한다.", async () => {
    // Given
    const transferEvent = createTransferEvent();

    transferEventRepository.existsByTransactionHashAndLogIndex.mockResolvedValue(
      true,
    );

    // When
    await transferEventSaveService.saveTransferEventsIfAbsent([transferEvent]);

    // Then
    expect(
      transferEventRepository.existsByTransactionHashAndLogIndex,
    ).toHaveBeenCalledWith(txHash, 0);
    expect(transferEventRepository.saveTransferEvent).not.toHaveBeenCalled();
  });
});
