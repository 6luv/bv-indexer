import { prisma } from "@/shared/database/prisma-client";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { PostgresTransactionRepository } from "@/transfer-indexing/infrastructure/database/postgres-transaction.repository";

describe("PostgresTransactionRepository", () => {
  let repository: PostgresTransactionRepository;
  const now = Math.floor(Date.now() / 1000);
  const BASE_TRANSACTION = Transaction.create(
    "0x" + "a".repeat(64),
    "0x" + "b".repeat(40),
    "0x" + "c".repeat(40),
    100n,
    "0x" + "d".repeat(64),
    100n,
    now,
  );

  beforeEach(async () => {
    repository = new PostgresTransactionRepository();
    await prisma.transferEvent.deleteMany();
    await prisma.transaction.deleteMany();
  });

  afterAll(async () => {
    await prisma.transferEvent.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.$disconnect();
  });

  it("트랜잭션을 저장하고 hash로 조회할 수 있어야 한다.", async () => {
    // Given
    const transaction = BASE_TRANSACTION;

    // When
    await repository.saveTransaction(transaction);
    const result = await repository.findTransactionByHash(
      transaction.getHash(),
    );

    // Then
    expect(result).not.toBeNull();
    expect(result?.getHash()).toBe(transaction.getHash());
    expect(result?.getFrom()).toBe(transaction.getFrom());
    expect(result?.getTo()).toBe(transaction.getTo());
    expect(result?.getValue()).toBe(transaction.getValue());
    expect(result?.getBlockHash()).toBe(transaction.getBlockHash());
    expect(result?.getBlockNumber()).toBe(transaction.getBlockNumber());
    expect(result?.getBlockTimestamp()).toBe(transaction.getBlockTimestamp());
  });

  it("같은 hash의 트랜잭션을 중복 저장하지 않아야 한다.", async () => {
    // Given
    const transaction = BASE_TRANSACTION;

    // When
    await repository.saveTransaction(transaction);
    await repository.saveTransaction(transaction);

    // Then
    const count = await repository.count();
    expect(count).toBe(1);
  });

  it("여러 트랜잭션을 저장할 수 있어야 한다.", async () => {
    // Given
    const tx1 = BASE_TRANSACTION;
    const tx2 = Transaction.create(
      "0x" + "e".repeat(64),
      "0x" + "f".repeat(40),
      "0x" + "g".repeat(40),
      200n,
      "0x" + "h".repeat(64),
      101n,
      now,
    );

    // When
    await repository.saveTransactions([tx1, tx2]);

    // Then
    expect(await repository.count()).toBe(2);

    const result1 = await repository.findTransactionByHash(tx1.getHash());
    const result2 = await repository.findTransactionByHash(tx2.getHash());
    expect(result1?.getHash()).toBe(tx1.getHash());
    expect(result2?.getHash()).toBe(tx2.getHash());
  });

  it("존재하지 않는 hash를 조회하면 null을 반환해야 한다.", async () => {
    // Given
    const unknownHash = "0x" + "i".repeat(64);

    // When
    const result = await repository.findTransactionByHash(unknownHash);

    // Then
    expect(result).toBeNull();
  });

  it("blockNumber로 트랜잭션 목록을 조회할 수 있어야 한다.", async () => {
    // Given
    const tx1 = BASE_TRANSACTION;
    const tx2 = Transaction.create(
      "0x" + "e".repeat(64),
      "0x" + "f".repeat(40),
      "0x" + "g".repeat(40),
      200n,
      "0x" + "h".repeat(64),
      100n,
      now,
    );
    const tx3 = Transaction.create(
      "0x" + "i".repeat(64),
      "0x" + "j".repeat(40),
      "0x" + "k".repeat(40),
      300n,
      "0x" + "l".repeat(64),
      101n,
      now,
    );

    await repository.saveTransactions([tx1, tx2, tx3]);

    // When
    const results = await repository.findTransactionByBlockNumber(100n);

    // Then
    expect(results).toHaveLength(2);
    expect(results.map((tx) => tx.getHash()).sort()).toEqual(
      [tx1.getHash(), tx2.getHash()].sort(),
    );
  });

  it("hash가 존재하면 existsByHash는 true를 반환해야 한다.", async () => {
    // Given
    const transaction = BASE_TRANSACTION;
    await repository.saveTransaction(transaction);

    // When
    const exists = await repository.existsByHash(transaction.getHash());

    // Then
    expect(exists).toBe(true);
  });

  it("hash가 존재하지 않으면 existsByHash는 false를 반환해야 한다.", async () => {
    // Given
    const unknownHash = "0x" + "i".repeat(64);

    // When
    const exists = await repository.existsByHash(unknownHash);

    // Then
    expect(exists).toBe(false);
  });

  it("저장된 트랜잭션 개수를 반환할 수 있어야 한다.", async () => {
    // Given
    const tx1 = BASE_TRANSACTION;
    const tx2 = Transaction.create(
      "0x" + "e".repeat(64),
      "0x" + "f".repeat(40),
      "0x" + "g".repeat(40),
      200n,
      "0x" + "h".repeat(64),
      101n,
      now,
    );

    await repository.saveTransactions([tx1, tx2]);

    // When
    const count = await repository.count();

    // Then
    expect(count).toBe(2);
  });
});
