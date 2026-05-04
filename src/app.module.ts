import { Module } from "@nestjs/common";
import { SyncController } from "./sync/entry-point/sync.controller";
import { CheckpointService } from "./checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "./transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { PostgresTransactionRepository } from "./transfer-indexing/infrastructure/database/postgres-transaction.repository";
import { PostgresTransferEventRepository } from "./transfer-indexing/infrastructure/database/postgres-transfer-event.repository";
import { PostgresCheckpointRepository } from "./checkpoint/infrastructure/database/postgres-checkpoint.repository";
import { ViemBlockReader } from "./sync/infrastructure/rpc/viem-block-reader";
import { ViemTransactionReader } from "./transfer-indexing/infrastructure/rpc/viem-transaction-reader";
import { ViemLogReader } from "./transfer-indexing/infrastructure/rpc/viem-log-reader";

@Module({
  controllers: [SyncController],
  providers: [
    Erc20TransferEventDecoder,
    ViemTransactionReader,
    ViemLogReader,
    ViemBlockReader,
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
