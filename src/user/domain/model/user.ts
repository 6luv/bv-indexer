export type UserProps = {
  address: string;
  chainId: number;
};

export class User {
  public readonly address: string;
  public readonly chainId: number;

  constructor(props: UserProps) {
    this.validate(props);
    this.address = props.address;
    this.chainId = props.chainId;
  }

  private validate(props: UserProps): void {
    if (!props.address || props.address.trim() === "") {
      throw new Error("User address is required");
    }

    if (!props.address.startsWith("0x")) {
      throw new Error("Invalid user address format");
    }

    if (props.chainId < 0) {
      throw new Error("Chain ID must be >= 0");
    }
  }
}
