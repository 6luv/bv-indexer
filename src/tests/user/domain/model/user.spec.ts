import { User, UserProps } from "@/user/domain/model/user";

describe("User", () => {
  const VALID_USER_ADDRESS = "0x" + "a".repeat(40);

  const BASE_PROPS: UserProps = {
    address: VALID_USER_ADDRESS,
    chainId: 1,
  };

  it("유효한 값으로 User를 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const user = new User(props);

    // Then
    expect(user.address).toBe(props.address);
    expect(user.chainId).toBe(props.chainId);
  });

  it("chainId가 0일 때 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, chainId: 0 };

    // When
    const user = new User(props);

    // Then
    expect(user.chainId).toBe(0);
  });

  it("address가 빈 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "" };

    // When & Then
    expect(() => new User(props)).toThrow("User address is required");
  });

  it("address가 공백 문자열이면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "   " };

    // When & Then
    expect(() => new User(props)).toThrow("User address is required");
  });

  it("address가 0x로 시작하지 않으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, address: "a".repeat(40) };

    // When & Then
    expect(() => new User(props)).toThrow("Invalid user address format");
  });

  it("chainId가 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, chainId: -1 };

    // When & Then
    expect(() => new User(props)).toThrow("Chain ID must be >= 0");
  });
});
