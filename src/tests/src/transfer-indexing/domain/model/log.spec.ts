import { Log } from "@/transfer-indexing/domain/model/log";

describe("Log", () => {
  const now = Math.floor(Date.now() / 1000);
  const BASE_PROPS = {
    address: "0x" + "a".repeat(40),
    topics: [
      "0xddf252ad" + "0".repeat(56),
      "0x" + "0".repeat(24) + "1".repeat(40),
      "0x" + "0".repeat(24) + "2".repeat(40),
    ],
    data: "0x" + "0".repeat(63) + "1",
    blockNumber: 100n,
    blockTimestamp: now,
    transactionHash: "0x" + "c".repeat(64),
    logIndex: 0,
  };

  const createLog = (props = BASE_PROPS) => {
    return Log.create(
      props.address,
      props.topics,
      props.data,
      props.blockNumber,
      props.blockTimestamp,
      props.transactionHash,
      props.logIndex,
    );
  };

  it("유효한 값으로 Log를 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const log = createLog(props);

    // Then
    expect(log.getAddress()).toBe(BASE_PROPS.address);
    expect(log.getTopics()).toBe(BASE_PROPS.topics);
    expect(log.getData()).toBe(BASE_PROPS.data);
    expect(log.getBlockNumber()).toBe(BASE_PROPS.blockNumber);
    expect(log.getBlockTimestamp()).toBe(BASE_PROPS.blockTimestamp);
    expect(log.getTransactionHash()).toBe(BASE_PROPS.transactionHash);
    expect(log.getLogIndex()).toBe(BASE_PROPS.logIndex);
  });

  it("address가 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "" };

    // When & Then
    expect(() => createLog(props)).toThrow("Log address is required");
  });

  it("address가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "   " };

    // When & Then
    expect(() => createLog(props)).toThrow("Log address is required");
  });

  // EVM
  it("address가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "a".repeat(40) };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid log address format");
  });

  it("address 길이가 42자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "0x" + "a".repeat(41) };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid log address format");
  });

  // ERC-20
  it("topics가 빈 배열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, topics: [] };

    // When & Then
    expect(() => createLog(props)).toThrow(
      "At least one log topic is required",
    );
  });

  it("topic이 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, topics: [""] };

    // When & Then
    expect(() => createLog(props)).toThrow("Log topic is required");
  });

  it("topic이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, topics: ["   "] };

    // When & Then
    expect(() => createLog(props)).toThrow("Log topic is required");
  });

  it("topic가 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, topics: ["a".repeat(64)] };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid log topic format");
  });

  it("topic 길이가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, topics: ["0x" + "a".repeat(65)] };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid log topic format");
  });

  it("data가 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, data: "" };

    // When & Then
    expect(() => createLog(props)).toThrow("Log data is required");
  });

  it("data가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, data: "   " };

    // When & Then
    expect(() => createLog(props)).toThrow("Log data is required");
  });

  it("data가 0x로 시작하지 않면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, data: "a".repeat(64) };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid log data format");
  });

  it("blockNumber가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: -1n };

    // When & Then
    expect(() => createLog(props)).toThrow("Block number must be >= 0");
  });

  it("blockTimestamp가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: -1 };

    // When & Then
    expect(() => createLog(props)).toThrow("Block timestamp must be >= 0");
  });

  it("transactionHash가 비어 있으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "" };

    // When & Then
    expect(() => createLog(props)).toThrow("Transaction hash is required");
  });

  it("transactionHash가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "   " };

    // When & Then
    expect(() => createLog(props)).toThrow("Transaction hash is required");
  });

  it("transactionHash가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "a".repeat(64) };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid transaction hash format");
  });

  it("transactionHash의 길이가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "0x" + "a".repeat(65) };

    // When & Then
    expect(() => createLog(props)).toThrow("Invalid transaction hash format");
  });

  it("logIndex가 0보다 작은면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, logIndex: -1 };

    // When & Then
    expect(() => createLog(props)).toThrow("Log index must be >= 0");
  });
});
