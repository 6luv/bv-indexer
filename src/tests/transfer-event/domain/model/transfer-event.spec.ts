import {
  TransferEvent,
  TransferEventProps,
} from "@/transfer-event/domain/model/transfer-event";

describe("Transfer-event", () => {
  const VALID_TOKEN_ADDRESS = "0x" + "a".repeat(40);
  const VALID_TRANSACTION_HASH = "0x" + "a".repeat(64);

  const BASE_PROPS: TransferEventProps = {
    tokenAddress: VALID_TOKEN_ADDRESS,
    from: "0x1111111111111111111111111111111111111111",
    to: "0x2222222222222222222222222222222222222222",
    value: 1000000000000000000n,
    blockNumber: 19654321n,
    blockTimestamp: 1718888888,
    transactionHash: VALID_TRANSACTION_HASH,
    logIndex: 1,
  };

  it("유효한 값으로 Transfer Event를 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const transferEvent = new TransferEvent(props);

    // Then
    expect(transferEvent.tokenAddress).toBe(props.tokenAddress);
    expect(transferEvent.from).toBe(props.from);
    expect(transferEvent.to).toBe(props.to);
    expect(transferEvent.value).toBe(props.value);
    expect(transferEvent.blockNumber).toBe(props.blockNumber);
    expect(transferEvent.blockTimestamp).toBe(props.blockTimestamp);
    expect(transferEvent.transactionHash).toBe(props.transactionHash);
    expect(transferEvent.logIndex).toBe(props.logIndex);
  });

  it("value가 0n일 때 정장 생성 되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, value: 0n };

    // When
    const transferEvent = new TransferEvent(props);

    // Then
    expect(transferEvent.value).toBe(0n);
  });

  it("blockNumber가 0n일 때 정상 생성 되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: 0n };

    // When
    const transferEvent = new TransferEvent(props);

    // Then
    expect(transferEvent.blockNumber).toBe(0n);
  });

  it("blockTimestamp가 0일 때 정상 생성 되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: 0 };

    // When
    const transferEvent = new TransferEvent(props);

    // Then
    expect(transferEvent.blockTimestamp).toBe(0);
  });

  it("tokenAddress가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "" };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("Token address is required");
  });

  it("tokenAddress가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "  " };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("Token address is required");
  });

  it("tokenAddress가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "a".repeat(64) };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Invalid token address format",
    );
  });

  it("from이 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "" };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("From address is required");
  });

  it("from이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, from: "  " };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("From address is required");
  });

  it("to가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "" };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("To address is required");
  });

  it("to가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, to: "  " };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("To address is required");
  });

  it("value가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, value: -1n };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Transfer value must be >= 0",
    );
  });

  it("blockNumber가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: -1n };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow("Block number must be >= 0");
  });

  it("blockTimestamp가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: -1 };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Block timestamp must be >= 0",
    );
  });

  it("transactionHash가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "" };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("transactionHash가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "  " };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Transaction hash is required",
    );
  });

  it("transactionHash가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "a".repeat(64) };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Invalid transaction hash format",
    );
  });

  it("transactionHash가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "0x1234" };

    // When & Then
    expect(() => new TransferEvent(props)).toThrow(
      "Invalid transaction hash length",
    );
  });
});
