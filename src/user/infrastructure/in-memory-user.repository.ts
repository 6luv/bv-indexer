import { User } from "../domain/model/user";
import { UserRepository } from "../domain/repository/user.repository";

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  private createKey(chainId: number, address: string): string {
    return `${chainId}-${address.toLocaleLowerCase()}`;
  }

  async saveUser(user: User): Promise<void> {
    const key = this.createKey(user.chainId, user.address);
    if (this.users.has(key)) return;
    this.users.set(key, user);
  }

  async findUserBychainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<User | null> {
    const key = this.createKey(chainId, address);
    return this.users.get(key) ?? null;
  }

  async findUsersByChainId(chainId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.chainId === chainId,
    );
  }

  async existsBychainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<boolean> {
    const key = this.createKey(chainId, address);
    return this.users.has(key);
  }
}
