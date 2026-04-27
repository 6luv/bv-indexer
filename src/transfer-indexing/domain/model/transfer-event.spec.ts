import { TransferEvent } from "./transfer-event";

describe("TransferEvent", () => {
  const now = Math.floor(Date.now() / 1000);
  const BASE_PROPS = {
    tokenAddress: "0x" + "a".repeat(40),
    from: "0x" + "b".repeat(40),
    to: "0x" + "c".repeat(40),
    value: 100n,
    blockNumber: 100n,
    blockTimestamp: now,
    transactionHash: "0x" + "d".repeat(64),
    logIndex: 0,
  };

  const createTransferEvent = (props = BASE_PROPS) => {
    return TransferEvent.create(
      props.tokenAddress,
      props.from,
      props.to,
      props.value,
      props.blockNumber,
      props.blockTimestamp,
      props.transactionHash,
      props.logIndex,
    );
  };

  it("유효한 값으로 TransferEvent를 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const transferEvent = createTransferEvent(props);

    // Then
    expect(transferEvent.getTokenAddress()).toBe(BASE_PROPS.tokenAddress);
    expect(transferEvent.getFrom()).toBe(BASE_PROPS.from);
    expect(transferEvent.getTo()).toBe(BASE_PROPS.to);
    expect(transferEvent.getValue()).toBe(BASE_PROPS.value);
    expect(transferEvent.getBlockNumber()).toBe(BASE_PROPS.blockNumber);
    expect(transferEvent.getBlockTimestamp()).toBe(BASE_PROPS.blockTimestamp);
    expect(transferEvent.getTransactionHash()).toBe(BASE_PROPS.transactionHash);
    expect(transferEvent.getLogIndex()).toBe(BASE_PROPS.logIndex);
  });

  it("tokenAddress가 비어 있면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "" };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Token address is required",
    );
  });

  it("tokenAddress가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "   " };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Token address is required",
    );
  });

  it("tokenAddress가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "a".repeat(42) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid token address format",
    );
  });

  it("tokenAddress가 42자리가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "0x" + "a".repeat(41) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid token address format",
    );
  });

  it("from이 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "" };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "From address is required",
    );
  });

  it("from이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "   " };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "From address is required",
    );
  });

  it("from이 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "a".repeat(40) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid from address format",
    );
  });

  it("from의 길이가 42자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "0x" + "a".repeat(41) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid from address format",
    );
  });

  it("to가 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "" };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow("To address is required");
  });

  it("to가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "   " };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow("To address is required");
  });

  it("to가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "a".repeat(42) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid to address format",
    );
  });

  it("to의 길이가 42자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "0x" + "a".repeat(41) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid to address format",
    );
  });

  it("value가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, value: -1n };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Transfer value must be >= 0",
    );
  });

  it("blockNumber가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: -1n };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Block number must be >= 0",
    );
  });

  it("blockTimestamp가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: -1 };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Block timestamp must be >= 0",
    );
  });

  it("transactionHash가 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "" };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("transactionHash가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "   " };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("transactionHash가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "a".repeat(64) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid transaction hash format",
    );
  });

  it("transactionHash의 길이가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "0x" + "a".repeat(65) };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow(
      "Invalid transaction hash format",
    );
  });

  it("logIndex가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, logIndex: -1 };

    // When & Then
    expect(() => createTransferEvent(props)).toThrow("Log index must be >= 0");
  });
});
