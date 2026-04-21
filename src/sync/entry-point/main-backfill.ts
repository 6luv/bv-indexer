import { BlockService } from "@/block/application/block.service";
import { InMemoryBlockRepository } from "@/block/infrastructure/database/in-memory-block.repository";
import { BlockRpcClient } from "@/block/infrastructure/rpc/block-rpc-client";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { InMemoryCheckpointRepository } from "@/checkpoint/infrastructure/database/in-memory-checkpoint.repository";
import { LogService } from "@/log/application/log.service";
import { InMemoryLogRepository } from "@/log/infrastructure/database/in-memory-log.repository";
import { TransactionService } from "@/transaction/application/transaction.service";
import { InMemoryTransactionRepository } from "@/transaction/infrastructure/database/in-memory-transaction.repository";
import { TransactionRpcClient } from "@/transaction/infrastructure/rpc/transaction-rpc-client";
import { TransferEventService } from "@/transfer-event/application/transfer-event.service";
import { InMemoryTransferEventRepository } from "@/transfer-event/infrastructure/database/im-memory-transfer-event.repository";
import { BackfillService } from "../application/backfill.service";
import { LogRpcClient } from "@/log/infrastructure/rpc/log-rpc-client";
import { Erc20TransferEventDecoder } from "@/transfer-event/infrastructure/decoder/erc20-transfer-event.decoder";

async function main(): Promise<void> {
  // block
  const blockRepository = new InMemoryBlockRepository();
  const blockRpcClient = new BlockRpcClient();
  const blockService = new BlockService(blockRpcClient, blockRepository);

  // transaction
  const transactionRepository = new InMemoryTransactionRepository();
  const transactionRpcClient = new TransactionRpcClient();
  const transactionService = new TransactionService(
    transactionRpcClient,
    transactionRepository,
  );

  // log
  const logRepository = new InMemoryLogRepository();
  const logRpcClient = new LogRpcClient();
  const logService = new LogService(logRpcClient, logRepository);

  // transfer event
  const transferEventRepository = new InMemoryTransferEventRepository();
  const transferEventDecoder = new Erc20TransferEventDecoder();
  const transferEventService = new TransferEventService(
    transferEventRepository,
    transferEventDecoder,
  );

  // checkpoint
  const checkpointRepository = new InMemoryCheckpointRepository();
  const checkpointService = new CheckpointService(checkpointRepository);

  // backfill
  const backfillService = new BackfillService(
    blockService,
    transactionService,
    logService,
    transferEventService,
    checkpointService,
  );
  await backfillService.runBackfill(0n, 10000n, 100);
}

main().catch((error) => {
  console.error("Backfill failed: ", error);
  process.exit(1);
});
