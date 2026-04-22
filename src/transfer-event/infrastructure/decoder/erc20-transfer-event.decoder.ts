import { Log } from "@/log/domain/model/log";
import { TransferEventDecoder } from "@/transfer-event/application/decoder/transfer-event.decoder";
import { TransferEvent } from "@/transfer-event/domain/model/transfer-event";

export class Erc20TransferEventDecoder implements TransferEventDecoder {
  private static readonly TRANSFER_EVENT_TOPIC =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  async decode(log: Log): Promise<TransferEvent | null> {
    if (log.topics.length < 3) return null;
    if (log.topics[0] !== Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC)
      return null;

    const from = "0x" + log.topics[1]?.slice(26);
    const to = "0x" + log.topics[2]?.slice(26);

    let value: bigint;
    try {
      value = BigInt(log.data);
    } catch {
      return null;
    }

    return new TransferEvent({
      tokenAddress: log.address,
      from,
      to,
      value,
      blockNumber: log.blockNumber,
      blockTimestamp: log.blockTimestamp,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
    });
  }
}
