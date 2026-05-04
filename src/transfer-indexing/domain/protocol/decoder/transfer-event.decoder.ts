import { Log } from "@/transfer-indexing/domain/model/log";
import { TransferEvent } from "@/transfer-indexing/domain/model/transfer-event";

export interface TransferEventDecoder {
  decode(log: Log): Promise<TransferEvent | null>;
}
