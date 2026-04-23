import "dotenv/config";
import express from "express";
import cors from "cors";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { InMemoryCheckpointRepository } from "@/checkpoint/infrastructure/database/in-memory-checkpoint.repository";

import {
  BlockTransferService,
  BlockRangeTransferService,
  LogTransferService,
} from "@/transfer-indexing/application/transfer-indexing-manage.service";

import { Erc20TransferEventDecoder } from "@/transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { InMemoryTransactionRepository } from "@/transfer-indexing/infrastructure/database/in-memory-transaction.repository";
import { InMemoryTransferEventRepository } from "@/transfer-indexing/infrastructure/database/in-memory-transfer-event.repository";

import { RunBackfillService } from "@/sync/application/run-backfill.service";
import { RunForwardfillService } from "@/sync/application/run-forwardfill.service";
import { TransactionRpcClient } from "./transfer-indexing/infrastructure/rpc/transaction-rpc-client";
import { LogRpcClient } from "./transfer-indexing/infrastructure/rpc/log-rpc-client";
import { createSyncRouter } from "./sync/entry-point/sync.controller";
import { BlockRpcClient } from "./sync/infrastructure/rpc/block-rpc-client";

async function main(): Promise<void> {
  const app = express();
  const port = 3001;

  app.use(cors({ origin: "*" }));
  app.use(express.json());

  const infuraKey = process.env.INFURA_API_KEY;

  const transactionRpcClient = new TransactionRpcClient();
  const transactionRepository = new InMemoryTransactionRepository();
  const transferEventRepository = new InMemoryTransferEventRepository();
  const checkpointRepository = new InMemoryCheckpointRepository();
  const blockRpcClient = new BlockRpcClient();
  const logRpcClient = new LogRpcClient();
  const transferEventDecoder = new Erc20TransferEventDecoder();
  const checkpointService = new CheckpointService(checkpointRepository);

  const runBackfillServiceFactory = (targetWalletAddress: string) => {
    const logTransferService = new LogTransferService(
      transferEventDecoder,
      transactionRpcClient,
      transactionRepository,
      transferEventRepository,
      targetWalletAddress,
    );

    const blockRangeTransferService = new BlockRangeTransferService(
      logRpcClient,
      logTransferService,
    );

    return new RunBackfillService(blockRangeTransferService, checkpointService);
  };

  const runForwardfillServiceFactory = (
    targetWalletAddress: string,
    pollingIntervalMs: number,
  ) => {
    const logTransferService = new LogTransferService(
      transferEventDecoder,
      transactionRpcClient,
      transactionRepository,
      transferEventRepository,
      targetWalletAddress,
    );

    const blockTransferService = new BlockTransferService(
      logRpcClient,
      logTransferService,
    );

    return new RunForwardfillService(
      blockRpcClient,
      blockTransferService,
      checkpointService,
      pollingIntervalMs,
    );
  };

  app.use(
    "/api/indexer",
    createSyncRouter({
      runBackfillServiceFactory,
      runForwardfillServiceFactory,
      checkpointService,
      blockRpcClient,
      transactionRepository,
      transferEventRepository,
    }),
  );

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});
