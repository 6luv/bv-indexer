import { TransferEventDecoder } from "@/transfer-indexing/application/decoder/transfer-event.decoder";
import { Log } from "@/transfer-indexing/domain/model/log";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";
import { Injectable } from "@nestjs/common";

@Injectable()
export class Erc20TransferEventDecoder implements TransferEventDecoder {
  public static readonly TRANSFER_EVENT_TOPIC =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  async decode(log: Log): Promise<TransferEvent | null> {
    const topics = log.getTopics();

    if (topics.length < 3) return null;

    const topic0 = topics[0];
    const topic1 = topics[1];
    const topic2 = topics[2];

    if (!topic0 || !topic1 || !topic2) return null;

    if (
      topic0.toLowerCase() !==
      Erc20TransferEventDecoder.TRANSFER_EVENT_TOPIC.toLowerCase()
    ) {
      return null;
    }

    const from = "0x" + topic1.slice(26);
    const to = "0x" + topic2.slice(26);

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
