import { Log, LogProps } from "@/log/domain/model/log";

describe("Log", () => {
  const VALID_TX_HASH = "0x" + "a".repeat(64);
  const VALID_ADDRESS = "0x" + "b".repeat(40);
  const VALID_TOPIC = "0x" + "c".repeat(64);

  const BASE_PROPS: LogProps = {
    address: VALID_ADDRESS,
    topics: [VALID_TOPIC],
    data: "0x" + "d".repeat(64),
    blockNumber: 19654321n,
    blockTimestamp: 1718888888,
    transactionHash: VALID_TX_HASH,
    logIndex: 0,
  };

  it("유효한 값으로 Log를 생성할 수 있어야 한다", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const log = new Log(props);

    // Then
    expect(log.address).toBe(props.address);
    expect(log.topics).toEqual(props.topics);
    expect(log.data).toBe(props.data);
    expect(log.blockNumber).toBe(props.blockNumber);
    expect(log.blockTimestamp).toBe(props.blockTimestamp);
    expect(log.transactionHash).toBe(props.transactionHash);
    expect(log.logIndex).toBe(props.logIndex);
  });

  it("transactionHash가 66자가 아니면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "0x1234" };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Invalid transaction hash length");
  });

  it("logIndex가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, logIndex: -1 };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log index must be >= 0");
  });

  it("address가 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, address: "" };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log address is required");
  });

  it("address가 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, address: "   " };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log address is required");
  });

  it("address가 0x로 시작하지 않으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, address: "b".repeat(40) };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Invalid log address format");
  });

  it("topics가 빈 배열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, topics: [] };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("At least one log topic is required");
  });

  it("topics에 빈 문자열이 있으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, topics: [""] };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log topic cannot be empty");
  });

  it("topics에 공백 문자열이 있으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, topics: ["   "] };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log topic cannot be empty");
  });

  it("topics에 0x로 시작하지 않는 문자열이 있으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, topics: ["c".repeat(64)] };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Invalid log topic format");
  });

  it("topics에 66자가 아닌 문자열이 있으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, topics: ["0x" + "c".repeat(63)] };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow(
      "Log topic must be 32 bytes (66 characters with '0x' prefix)",
    );
  });

  it("data가 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, data: "" };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log data is required");
  });

  it("data가 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, data: "   " };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log data is required");
  });

  it("data가 0x로 시작하지 않으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, data: "d".repeat(64) };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Invalid log data format");
  });

  it("blockNumber가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockNumber: -1n };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Block number must be >= 0");
  });

  it("blockTimestamp가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, blockTimestamp: -1 };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Block timestamp must be >= 0");
  });

  it("transactionHash가 빈 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "" };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Transaction hash is required");
  });

  it("transactionHash가 공백 문자열이면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "   " };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Transaction hash is required");
  });

  it("transactionHash가 0x로 시작하지 않으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "a".repeat(64) };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Invalid transaction hash format");
  });

  it("transactionHash가 66자가 아니면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, transactionHash: "0x1234" };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Invalid transaction hash length");
  });

  it("logIndex가 0보다 작으면 에러가 발생해야 한다", () => {
    // Given
    const props = { ...BASE_PROPS, logIndex: -1 };

    // When & Then: 예외가 발생해야 한다
    expect(() => new Log(props)).toThrow("Log index must be >= 0");
  });
});
