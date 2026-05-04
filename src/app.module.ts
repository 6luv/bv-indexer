import { Module } from "@nestjs/common";
import { SyncController } from "./sync/entry-point/sync.controller";
import { CheckpointService } from "./checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "./transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { TransactionRpcClient } from "./transfer-indexing/infrastructure/rpc/transaction-rpc-client";
import { LogRpcClient } from "./transfer-indexing/infrastructure/rpc/log-rpc-client";
import { BlockRpcClient } from "./sync/infrastructure/rpc/block-rpc-client";
import { PostgresTransactionRepository } from "./transfer-indexing/infrastructure/database/postgres-transaction.repository";
import { PostgresTransferEventRepository } from "./transfer-indexing/infrastructure/database/postgres-transfer-event.repository";
import { PostgresCheckpointRepository } from "./checkpoint/infrastructure/database/postgres-checkpoint.repository";

@Module({
  controllers: [SyncController],
  providers: [
    Erc20TransferEventDecoder,
    TransactionRpcClient,
    LogRpcClient,
    BlockRpcClient,
    PostgresTransactionRepository,
    PostgresTransferEventRepository,
    PostgresCheckpointRepository,
    {
      provide: CheckpointService,
      useFactory: (checkpointRepository: PostgresCheckpointRepository) =>
        new CheckpointService(checkpointRepository),
      inject: [PostgresCheckpointRepository],
    },
  ],
})
export class AppModule {}
