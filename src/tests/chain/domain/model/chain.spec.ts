import { Chain, ChainProps } from "@/chain/domain/model/chain";

describe("Chain", () => {
  const BASE_PROPS: ChainProps = {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/test-key",
  };

  it("유효한 값으로 Chain을 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const chain = new Chain(props);

    // Then
    expect(chain.chainId).toBe(props.chainId);
    expect(chain.name).toBe(props.name);
    expect(chain.rpcUrl).toBe(props.rpcUrl);
  });

  it("chainId가 0일 때 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, chainId: 0 };

    // When
    const chain = new Chain(props);

    // Then
    expect(chain.chainId).toBe(0);
  });

  it("rpcUrl이 http로 시작하면 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, rpcUrl: "http://localhost:8545" };

    // When
    const chain = new Chain(props);

    // Then
    expect(chain.rpcUrl).toBe("http://localhost:8545");
  });

  it("name이 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, name: "" };

    // When & Then
    expect(() => new Chain(props)).toThrow("Chain name is required");
  });

  it("name이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, name: "   " };

    // When & Then
    expect(() => new Chain(props)).toThrow("Chain name is required");
  });

  it("rpcUrl이 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, rpcUrl: "" };

    // When & Then
    expect(() => new Chain(props)).toThrow("RPC URL is required");
  });

  it("rpcUrl이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, rpcUrl: "   " };

    // When & Then
    expect(() => new Chain(props)).toThrow("RPC URL is required");
  });

  it("rpcUrl이 http:// 또는 https://로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, rpcUrl: "ws://localhost:8545" };

    // When & Then
    expect(() => new Chain(props)).toThrow("Invalid RPC URL format");
  });

  it("chainId가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, chainId: -1 };

    // When & Then
    expect(() => new Chain(props)).toThrow("Chain ID must be >= 0");
  });
});