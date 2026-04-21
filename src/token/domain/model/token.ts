export type TokenProps = {
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
};

export class Token {
  public readonly tokenAddress: string;
  public readonly name: string;
  public readonly symbol: string;
  public readonly decimals: number;
  public readonly chainId: number;

  constructor(props: TokenProps) {
    this.validate(props);
    this.tokenAddress = props.tokenAddress;
    this.name = props.name;
    this.symbol = props.symbol;
    this.decimals = props.decimals;
    this.chainId = props.chainId;
  }

  private validate(props: TokenProps): void {
    if (!props.tokenAddress || props.tokenAddress.trim() === "") {
      throw new Error("Token address is required");
    }

    if (!props.tokenAddress.startsWith("0x")) {
      throw new Error("Invalid token address format");
    }

    if (!props.name || props.name.trim() === "") {
      throw new Error("Token name is required");
    }

    if (!props.symbol || props.symbol.trim() === "") {
      throw new Error("Token symbol is required");
    }

    if (props.decimals < 0) {
      throw new Error("Token decimals must be >= 0");
    }

    if (props.chainId < 0) {
      throw new Error("Chain ID must be >= 0");
    }
  }
}
