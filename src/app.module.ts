import { Module } from "@nestjs/common";
import { SyncController } from "./sync/entry-point/sync.controller";
import { CheckpointService } from "./checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "./transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { PostgresTransactionRepository } from "./transfer-indexing/infrastructure/database/postgres-transaction.repository";
import { PostgresTransferEventRepository } from "./transfer-indexing/infrastructure/database/postgres-transfer-event.repository";
import { PostgresCheckpointRepository } from "./checkpoint/infrastructure/database/postgres-checkpoint.repository";
import { BlockchainBlockReader } from "./sync/infrastructure/rpc/blockchain-block-reader";
import { BlockchainLogReader } from "./transfer-indexing/infrastructure/rpc/blockchain-log-reader";
import { BlockchainTransactionReader } from "./transfer-indexing/infrastructure/rpc/blockchain-transaction-reader";
import { BLOCKCHAIN_CLIENT } from "./shared/domain/protocol/blockchain-client.protocol";
import { ViemBlockchainClient } from "./shared/viem/viem-blockchain-client";

@Module({
  controllers: [SyncController],
  providers: [
    Erc20TransferEventDecoder,

    {
      provide: BLOCKCHAIN_CLIENT,
      useClass: ViemBlockchainClient,
    },

    BlockchainLogReader,
    BlockchainTransactionReader,
    BlockchainBlockReader,

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
