import { Log } from "@/transfer-indexing/domain/model/log";
import { Erc20TransferEventDecoder } from "./erc20-transfer-event.decoder";

describe("Erc20TransferEventDecoder", () => {
  const decoder = new Erc20TransferEventDecoder();
  const now = Math.floor(Date.now() / 1000);

  const tokenAddress = "0x" + "a".repeat(40);
  const fromAddress = "0x" + "1".repeat(40);
  const toAddress = "0x" + "2".repeat(40);
  const txHash = "0x" + "b".repeat(64);

  const createTopicAddress = (address: string) => {
    return "0x" + "0".repeat(24) + address.slice(2);
  };

  const createLog = (
    topics = [
      Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC,
      createTopicAddress(fromAddress),
      createTopicAddress(toAddress),
    ],
    data = "0x" + "0".repeat(63) + "1",
  ) => {
    return Log.create(tokenAddress, topics, data, 100n, now, txHash, 0);
  };

  it("ERC-20 Transfer 로그를 TransferEvent로 디코딩할 수 있어야 한다.", async () => {
    // Given
    const log = createLog();

    // When
    const result = await decoder.decode(log);

    // Then
    expect(result).not.toBeNull();
    expect(result?.getTokenAddress()).toBe(tokenAddress);
    expect(result?.getFrom()).toBe(fromAddress);
    expect(result?.getTo()).toBe(toAddress);
    expect(result?.getValue()).toBe(1n);
    expect(result?.getBlockNumber()).toBe(100n);
    expect(result?.getBlockTimestamp()).toBe(now);
    expect(result?.getTransactionHash()).toBe(txHash);
    expect(result?.getLogIndex()).toBe(0);
  });

  it("topics 길이가 3보다 작으면 null을 반환해야 한다.", async () => {
    // Given
    const log = createLog([
      Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC,
      createTopicAddress(fromAddress),
    ]);

    // When
    const result = await decoder.decode(log);

    // Then
    expect(result).toBeNull();
  });

  it("topic0이 Transfer 이벤트 시그니처가 아니면 null을 반환해야 한다.", async () => {
    // Given
    const log = createLog([
      createTopicAddress(fromAddress),
      createTopicAddress(toAddress),
    ]);

    // When
    const result = await decoder.decode(log);

    // Then
    expect(result).toBeNull();
  });

  it("data가 bigint로 변환 불가능하면 null을 반환해야 한다.", async () => {
    // Given
    const log = createLog(
      [
        Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC,
        createTopicAddress(fromAddress),
        createTopicAddress(toAddress),
      ],
      "0xzz",
    );

    // When
    const result = await decoder.decode(log);

    // Then
    expect(result).toBeNull();
  });

  it("topic0 대소문자가 달라도 TransferEvent로 디코딩할 수 있어야 한다.", async () => {
    // Given
    const log = createLog([
      Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC.toUpperCase().replace(
        "0X",
        "0x",
      ),
      createTopicAddress(fromAddress),
      createTopicAddress(toAddress),
    ]);

    // When
    const result = await decoder.decode(log);

    // Then
    expect(result).not.toBeNull();
    expect(result?.getFrom()).toBe(fromAddress);
    expect(result?.getTo()).toBe(toAddress);
  });
});
