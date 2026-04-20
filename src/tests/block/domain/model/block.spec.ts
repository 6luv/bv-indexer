import { Block, BlockProps } from "@/block/domain/model/block";

describe("Block", () => {
  const VALID_HASH = "0x" + "a".repeat(64);
  const VALID_PARENT_HASH = "0x" + "b".repeat(64);

  const BASE_PROPS: BlockProps = {
    number: 19654321n,
    hash: VALID_HASH,
    parentHash: VALID_PARENT_HASH,
    timestamp: 1718888888,
  };

  it("유효한 값으로 Block을 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const block = new Block(props);

    // Then
    expect(block.number).toBe(props.number);
    expect(block.hash).toBe(props.hash);
    expect(block.parentHash).toBe(props.parentHash);
    expect(block.timestamp).toBe(props.timestamp);
  });

  it("number가 0n일 때 정상 생성 되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, number: 0n };

    // When
    const block = new Block(props);

    // Then
    expect(block.number).toBe(0n);
  });

  it("timestamp가 0일 때 정상 생성 되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, timestamp: 0 };

    // When
    const block = new Block(props);

    // Then
    expect(block.timestamp).toBe(0);
  });

  it("number가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, number: -1n };

    // When & Then
    expect(() => new Block(props)).toThrow("Block number must be >= 0");
  });

  it("hash가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "" };

    // When & Then
    expect(() => new Block(props)).toThrow("Block hash is required");
  });

  it("hash가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "   " };

    // When & Then
    expect(() => new Block(props)).toThrow("Block hash is required");
  });

  it("hash가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "a".repeat(64) };

    // When & Then
    expect(() => new Block(props)).toThrow("Invalid block hash format");
  });

  it("hash가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, hash: "0x" + "a".repeat(63) };

    // When & Then
    expect(() => new Block(props)).toThrow("Invalid block hash length");
  });

  it("parentHash가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, parentHash: "" };

    // When & Then
    expect(() => new Block(props)).toThrow("Parent hash is required");
  });

  it("parentHash가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, parentHash: "   " };

    // When & Then
    expect(() => new Block(props)).toThrow("Parent hash is required");
  });

  it("parentHash가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, parentHash: "b".repeat(64) };

    // When & Then
    expect(() => new Block(props)).toThrow("Invalid parent hash format");
  });

  it("parentHash가 66자가 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, parentHash: "0x" + "b".repeat(63) };

    // When & Then
    expect(() => new Block(props)).toThrow("Invalid parent hash length");
  });

  it("timestamp가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, timestamp: -1 };

    // When & Then
    expect(() => new Block(props)).toThrow("Timestamp must be >= 0");
  });
});
