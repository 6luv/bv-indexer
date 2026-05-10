import { prisma } from "@/shared/database/prisma-client";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";
import { PostgresTransferEventRepository } from "@/transfer-indexing/infrastructure/database/postgres-transfer-event.repository";

describe("PostgresTransferEventRepository", () => {
  let repository: PostgresTransferEventRepository;
  const now = Math.floor(Date.now() / 1000);
  const txHash = "0x" + "a".repeat(64);

  const createTransaction = () =>
    Transaction.create(
      txHash,
      "0x" + "b".repeat(40),
      "0x" + "c".repeat(40),
      100n,
      "0x" + "d".repeat(64),
      100n,
      now,
    );

  const createTransferEvent = (logIndex = 0) =>
    TransferEvent.create(
      "0x" + "e".repeat(40),
      "0x" + "f".repeat(40),
      "0x" + "g".repeat(40),
      100n,
      100n,
      now,
      txHash,
      logIndex,
    );

  beforeEach(async () => {
    repository = new PostgresTransferEventRepository();

    await prisma.transferEvent.deleteMany();
    await prisma.transaction.deleteMany();

    const transaction = createTransaction();
    await prisma.transaction.create({
      data: {
        hash: transaction.getHash(),
        fromAddress: transaction.getFrom(),
        toAddress: transaction.getTo(),
        value: transaction.getValue(),
        blockHash: transaction.getBlockHash(),
        blockNumber: transaction.getBlockNumber(),
        blockTimestamp: transaction.getBlockTimestamp(),
      },
    });
  });

  afterAll(async () => {
    await prisma.transferEvent.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.$disconnect();
  });

  it("TransferEvent를 저장할 수 있어야 한다.", async () => {
    // Given
    const transferEvent = createTransferEvent();

    // When
    await repository.saveTransferEvent(transferEvent);

    // Then
    const count = await repository.count();
    expect(count).toBe(1);
  });

  it("같은 transactionHash와 logIndex를 가진 TransferEvent를 중복 저장하지 않아야 한다.", async () => {
    // Given
    const transferEvent = createTransferEvent();

    // When
    await repository.saveTransferEvent(transferEvent);
    await repository.saveTransferEvent(transferEvent);

    // Then
    const count = await repository.count();
    expect(count).toBe(1);
  });

  it("여러 TransferEvent을 저장할 수 있어야 한다.", async () => {
    // Given
    const transferEvent1 = createTransferEvent(0);
    const transferEvent2 = createTransferEvent(1);

    // When
    await repository.saveTransferEvents([transferEvent1, transferEvent2]);

    // Then
    const count = await repository.count();
    expect(count).toBe(2);
  });

  it("transactionHash와 logIndex가 존재하면 true를 반환해야 한다.", async () => {
    // Given
    const transferEvent = createTransferEvent();
    await repository.saveTransferEvent(transferEvent);

    // When
    const exists = await repository.existsByTransactionHashAndLogIndex(
      transferEvent.getTransactionHash(),
      transferEvent.getLogIndex(),
    );

    // Then
    expect(exists).toBe(true);
  });

  it("transactionHash와 logIndex가 존재하지 않으면 false를 반환해야 한다.", async () => {
    // When
    const exists = await repository.existsByTransactionHashAndLogIndex(
      "0x" + "i".repeat(64),
      999,
    );

    // Then
    expect(exists).toBe(false);
  });

  it("저장된 TransferEvent 개수를 반환할 수 있어야 한다.", async () => {
    // Given
    await repository.saveTransferEvents([
      createTransferEvent(0),
      createTransferEvent(1),
    ]);

    // When
    const count = await repository.count();

    // Then
    expect(count).toBe(2);
  });
});
