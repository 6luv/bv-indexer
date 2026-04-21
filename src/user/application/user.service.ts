import { User } from "../domain/model/user";
import { UserRepository } from "../domain/repository/user.repository";

export class UserServuce {
  constructor(private readonly userRepository: UserRepository) {}

  // 특정 체인의 특정 사용자 조회
  async getUserByChainIdAndAddress(
    chainId: number,
    address: string,
  ): Promise<User | null> {
    return this.userRepository.findUserBychainIdAndAddress(chainId, address);
  }

  // 특정 체인의 사용자 목록 조회
  async getUsersByChainId(chainId: number): Promise<User[]> {
    return this.userRepository.findUsersByChainId(chainId);
  }

  // 사용자 1명 저장
  async saveUser(user: User): Promise<void> {
    const exists = await this.userRepository.existsBychainIdAndAddress(
      user.chainId,
      user.address,
    );

    if (exists) return;
    await this.userRepository.saveUser(user);
  }
}
