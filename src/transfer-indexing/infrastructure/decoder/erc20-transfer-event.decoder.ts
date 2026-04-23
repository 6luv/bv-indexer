import { TransferEventDecoder } from "@/transfer-indexing/application/decoder/transfer-event.decoder";
import { Log } from "@/transfer-indexing/domain/model/log";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";

export class Erc20TransferEventDecoder implements TransferEventDecoder {
  private static readonly TRANSFER_EVENT_TOPIC =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  async decode(log: Log): Promise<TransferEvent | null> {
    if (log.getTopics().length < 3) return null;
    if (log.getTopics()[0] !== Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC)
      return null;

    const from = "0x" + log.getTopics()[1]?.slice(26);
    const to = "0x" + log.getTopics()[2]?.slice(26);

    let value: bigint;
    try {
      value = BigInt(log.getData());
    } catch {
      return null;
    }

    return TransferEvent.create(
      log.getAddress(),
      from,
      to,
      value,
      log.getBlockNumber(),
      log.getBlockTimestamp(),
      log.getTransactionHash(),
      log.getLogIndex(),
    );
  }
}
