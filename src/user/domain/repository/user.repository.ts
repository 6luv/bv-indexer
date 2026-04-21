import { User } from "../model/user";

export interface UserRepository {
  saveUser(user: User): Promise<void>;
  findUserBychainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<User | null>;
  findUsersByChainId(chainId: number): Promise<User[]>;
  existsBychainIdAndAddress(chainId: number, address: string): Promise<boolean>;
}
