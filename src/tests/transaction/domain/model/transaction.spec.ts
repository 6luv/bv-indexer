import {
  Transaction,
  TransactionProps,
} from "@/transaction/domain/model/transaction";

describe("Transaction", () => {
  const VALID_TX_HASH = "0x" + "a".repeat(64);
  const VALID_BLOCK_HASH = "0x" + "b".repeat(64);

  const BASE_PROPS: TransactionProps = {
    hash: VALID_TX_HASH,
    from: "0x1111111111111111111111111111111111111111",
    to: "0x2222222222222222222222222222222222222222",
    value: 1000000000000000000n,
    blockHash: VALID_BLOCK_HASH,
    blockNumber: 19654321n,
    blockTimestamp: 1718888888,
  };

  it("유효한 값으로 Transaction을 생성할 수 있어야 한다", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const transaction = new Transaction(props);

    // Then
    expect(transaction.hash).toBe(props.hash);
    expect(transaction.from).toBe(props.from);
    expect(transaction.to).toBe(props.to);
    expect(transaction.value).toBe(props.value);
    expect(transaction.blockHash).toBe(props.blockHash);
    expect(transaction.blockNumber).toBe(props.blockNumber);
    expect(transaction.blockTimestamp).toBe(props.blockTimestamp);
  });

  it("value가 0n일 때 정상 생성 되어야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, value: 0n };

    // When
    const transaction = new Transaction(props);

    // Then
    expect(transaction.value).toBe(0n);
  });

  it("blockNumber가 0n일 때 정상 생성 되어야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: 0n };

    // When
    const transaction = new Transaction(props);

    // Then
    expect(transaction.blockNumber).toBe(0n);
  });

  it("blockTimestamp가 0일 때 정상 생성 되어야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: 0 };

    // When
    const transaction = new Transaction(props);

    // Then
    expect(transaction.blockTimestamp).toBe(0);
  });

  it("hash가 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "" };

    // When & Then
    expect(() => new Transaction(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("hash가 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "   " };

    // When & Then
    expect(() => new Transaction(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("hash가 0x로 시작하지 않으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "a".repeat(64) };

    // When & Then
    expect(() => new Transaction(props)).toThrow(
      "Invalid transaction hash format",
    );
  });

  it("hash가 66자가 아니면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "0x1234" };

    // When & Then
    expect(() => new Transaction(props)).toThrow(
      "Invalid transaction hash length",
    );
  });

  it("from이 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, from: "" };

    // When & Then
    expect(() => new Transaction(props)).toThrow("From address is required");
  });

  it("from이 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, from: "   " };

    // When & Then
    expect(() => new Transaction(props)).toThrow("From address is required");
  });

  it("to가 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, to: "" };

    // When & Then
    expect(() => new Transaction(props)).toThrow("To address is required");
  });

  it("to가 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, to: "   " };

    // When & Then
    expect(() => new Transaction(props)).toThrow("To address is required");
  });

  it("value가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, value: -1n };

    // When & Then
    expect(() => new Transaction(props)).toThrow(
      "Transaction value must be >= 0",
    );
  });

  it("blockHash가 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "" };

    // When & Then
    expect(() => new Transaction(props)).toThrow("Block hash is required");
  });

  it("blockHash가 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "   " };

    // When & Then
    expect(() => new Transaction(props)).toThrow("Block hash is required");
  });

  it("blockHash가 0x로 시작하지 않으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "b".repeat(64) };

    // When & Then
    expect(() => new Transaction(props)).toThrow("Invalid block hash format");
  });

  it("blockHash가 66자가 아니면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "0x1234" };

    // When & Then
    expect(() => new Transaction(props)).toThrow("Invalid block hash length");
  });

  it("blockNumber가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: -1n };

    // When & Then
    expect(() => new Transaction(props)).toThrow("Block number must be >= 0");
  });

  it("blockTimestamp가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: -1 };

    // When & Then
    expect(() => new Transaction(props)).toThrow(
      "Block timestamp must be >= 0",
    );
  });
});
