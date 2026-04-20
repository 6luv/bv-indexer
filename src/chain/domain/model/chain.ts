export type ChainProps = {
  chainId: number;
  name: string;
  rpcUrl: string;
};

export class Chain {
  public readonly chainId: number;
  public readonly name: string;
  public readonly rpcUrl: string;

  constructor(props: ChainProps) {
    this.validate(props);
    this.chainId = props.chainId;
    this.name = props.name;
    this.rpcUrl = props.rpcUrl;
  }

  private validate(props: ChainProps): void {
    if (props.chainId < 0) {
      throw new Error("Chain ID must be >= 0");
    }

    if (!props.name || props.name.trim() === "") {
      throw new Error("Chain name is required");
    }

    if (!props.rpcUrl || props.rpcUrl.trim() === "") {
      throw new Error("RPC URL is required");
    }

    if (
      !props.rpcUrl.startsWith("http://") &&
      !props.rpcUrl.startsWith("https://")
    ) {
      throw new Error("Invalid RPC URL format");
    }
  }
}
