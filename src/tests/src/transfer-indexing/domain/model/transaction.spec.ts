import { Transaction } from "@/transfer-indexing/domain/model/transaction";

describe("Transaction", () => {
  const now = Math.floor(Date.now() / 1000);
  const BASE_PROPS = {
    hash: "0x" + "a".repeat(64),
    from: "0x" + "b".repeat(40),
    to: "0x" + "c".repeat(40),
    value: 100n,
    blockHash: "0x" + "d".repeat(64),
    blockNumber: 100n,
    blockTimestamp: now,
  };

  const createTransaction = (props = BASE_PROPS) => {
    return Transaction.create(
      props.hash,
      props.from,
      props.to,
      props.value,
      props.blockHash,
      props.blockNumber,
      props.blockTimestamp,
    );
  };

  it("유효한 값으로 Transaction을 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const transaction = createTransaction(props);

    // Then
    expect(transaction.getHash()).toBe(BASE_PROPS.hash);
    expect(transaction.getFrom()).toBe(BASE_PROPS.from);
    expect(transaction.getTo()).toBe(BASE_PROPS.to);
    expect(transaction.getValue()).toBe(BASE_PROPS.value);
    expect(transaction.getBlockHash()).toBe(BASE_PROPS.blockHash);
    expect(transaction.getBlockNumber()).toBe(BASE_PROPS.blockNumber);
    expect(transaction.getBlockTimestamp()).toBe(BASE_PROPS.blockTimestamp);
  });

  it("hash가 비어 있면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "" };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("hash가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "   " };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("hash가 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "a".repeat(64) };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Invalid transaction hash format",
    );
  });

  it("hash의 길이가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "0x" + "a".repeat(65) };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Invalid transaction hash format",
    );
  });

  it("from이 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "" };

    // When & Then
    expect(() => createTransaction(props)).toThrow("From address is required");
  });

  it("from이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "   " };

    // When & Then
    expect(() => createTransaction(props)).toThrow("From address is required");
  });

  it("from이 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "a".repeat(40) };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Invalid from address format",
    );
  });

  it("from의 길이가 42자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "0x" + "a".repeat(41) };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Invalid from address format",
    );
  });

  it("to가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "   " };

    // When & Then
    expect(() => createTransaction(props)).toThrow("To address is required");
  });

  it("to가 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "a".repeat(40) };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Invalid to address format");
  });

  it("to의 길이가 42자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "0x" + "a".repeat(41) };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Invalid to address format");
  });

  it("value가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, value: -1n };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Transaction value must be >= 0",
    );
  });

  it("blockHash가 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "" };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Block hash is required");
  });

  it("blockHash가 공백 문자열이라면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "   " };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Block hash is required");
  });

  it("blockHash가 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "a".repeat(64) };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Invalid block hash format");
  });

  it("blockHash의 길이가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockHash: "0x" + "a".repeat(65) };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Invalid block hash format");
  });

  it("blockNumber가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: -1n };

    // When & Then
    expect(() => createTransaction(props)).toThrow("Block number must be >= 0");
  });

  it("blockTimestamp가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: -1 };

    // When & Then
    expect(() => createTransaction(props)).toThrow(
      "Block timestamp must be >= 0",
    );
  });
});
