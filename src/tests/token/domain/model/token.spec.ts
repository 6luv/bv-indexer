import { Token, TokenProps } from "@/token/domain/model/token";

describe("Token", () => {
  const VALID_TOKEN_ADDRESS = "0x" + "a".repeat(40);

  const BASE_PROPS: TokenProps = {
    tokenAddress: VALID_TOKEN_ADDRESS,
    symbol: "USDC",
    decimals: 6,
    chainId: 1,
  };

  it("유효한 값으로 Token을 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const token = new Token(props);

    // Then
    expect(token.tokenAddress).toBe(props.tokenAddress);
    expect(token.symbol).toBe(props.symbol);
    expect(token.decimals).toBe(props.decimals);
    expect(token.chainId).toBe(props.chainId);
  });

  it("decimals가 0일 때 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, decimals: 0 };

    // When
    const token = new Token(props);

    // Then
    expect(token.decimals).toBe(0);
  });

  it("chainId가 0일 때 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, chainId: 0 };

    // When
    const token = new Token(props);

    // Then
    expect(token.chainId).toBe(0);
  });

  it("tokenAddress가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "" };

    // When & Then
    expect(() => new Token(props)).toThrow("Token address is required");
  });

  it("tokenAddress가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "   " };

    // When & Then
    expect(() => new Token(props)).toThrow("Token address is required");
  });

  it("tokenAddress가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, tokenAddress: "a".repeat(40) };

    // When & Then
    expect(() => new Token(props)).toThrow("Invalid token address format");
  });

  it("symbol이 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, symbol: "" };

    // When & Then
    expect(() => new Token(props)).toThrow("Token symbol is required");
  });

  it("symbol이 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, symbol: "   " };

    // When & Then
    expect(() => new Token(props)).toThrow("Token symbol is required");
  });

  it("decimals가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, decimals: -1 };

    // When & Then
    expect(() => new Token(props)).toThrow("Token decimals must be >= 0");
  });

  it("chainId가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, chainId: -1 };

    // When & Then
    expect(() => new Token(props)).toThrow("Chain ID must be >= 0");
  });
});
