import { Log } from "@/log/domain/model/log";
import { TransferEvent } from "@/transfer-event/domain/model/transfer-event";

export interface TransferEventDecoder {
  decode(log: Log): Promise<TransferEvent | null>;
}
