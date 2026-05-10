import { Controller, Get, Post, Body, Inject, Logger } from "@nestjs/common";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "@/transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { RunBackfillService } from "../application/run-backfill.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { BlockBatchProcessor } from "../application/block-batch-processor.service";
import { TransferEventIndexerService } from "@/transfer-indexing/application/transfer-event-indexer.service";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";
import { TransferEventSaveService } from "@/transfer-indexing/application/transfer-event-save.service";
import {
  BLOCK_READER,
  BlockReader,
} from "../domain/protocol/block-reader.protocol";
import {
  LOG_READER,
  LogReader,
} from "@/transfer-indexing/domain/protocol/log-reader.protocol";
import {
  TRANSACTION_READER,
  TransactionReader,
} from "@/transfer-indexing/domain/protocol/transaction-reader.protocol";
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from "@/transfer-indexing/domain/repository/transaction.repository";
import {
  TRANSFER_EVENT_REPOSITORY,
  TransferEventRepository,
} from "@/transfer-indexing/domain/repository/transfer-event.repository";

@Controller("api/indexer")
export class SyncController {
  private readonly logger = new Logger(SyncController.name);
  private isBackfillRunning = false;

  private currentTargetWalletAddress: string | null = null;
  private backfillStartBlock: number | null = null;
  private backfillEndBlock: number | null = null;
  private backfillBatchSize: number | null = null;
  private lastErrorMessage: string | null = null;

  constructor(
    @Inject(CheckpointService)
    private readonly checkpointService: CheckpointService,
    @Inject(BLOCK_READER)
    private readonly blockReader: BlockReader,
    @Inject(LOG_READER)
    private readonly logReader: LogReader,
    @Inject(TRANSACTION_READER)
    private readonly transactionReader: TransactionReader,
    @Inject(Erc20TransferEventDecoder)
    private readonly transferEventDecoder: Erc20TransferEventDecoder,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(TRANSFER_EVENT_REPOSITORY)
    private readonly transferEventRepository: TransferEventRepository,
  ) {}

  @Get("status")
  async getStatus() {
    const backfillCheckpoint = await this.checkpointService.getCheckpointByType(
      CheckpointType.BACKFILL,
    );

    const latestBlock = await this.blockReader.getLatestBlockNumber();
    const savedTransactionCount = await this.transactionRepository.count();
    const savedTransferEventCount = await this.transferEventRepository.count();

    return {
      targetWalletAddress: this.currentTargetWalletAddress,

      latestBlock: Number(latestBlock),

      backfill: {
        status: this.isBackfillRunning ? "RUNNING" : "IDLE",
        startBlock: this.backfillStartBlock,
        endBlock: this.backfillEndBlock,
        batchSize: this.backfillBatchSize,
        lastProcessedBlock: backfillCheckpoint
          ? Number(backfillCheckpoint.getLastProcessedBlock())
          : null,
      },

      savedBlockCount: 0,
      savedTransactionCount,
      savedLogCount: 0,
      savedTransferEventCount,

      errorMessage: this.lastErrorMessage,
      updatedAt: new Date().toISOString(),
    };
  }

  @Post("backfill")
  async backfill(@Body() body: any) {
    const { targetWalletAddress, startBlock, endBlock, batchSize } = body;

    if (
      !targetWalletAddress ||
      startBlock === undefined ||
      endBlock === undefined ||
      batchSize === undefined
    ) {
      return {
        ok: false,
        message:
          "targetWalletAddress, startBlock, endBlock, batchSize are required",
      };
    }

    if (this.isBackfillRunning) {
      return {
        ok: false,
        message: "Backfill is already running",
      };
    }

    this.currentTargetWalletAddress = targetWalletAddress;

    this.backfillStartBlock = Number(startBlock);
    this.backfillEndBlock = Number(endBlock);
    this.backfillBatchSize = Number(batchSize);

    this.lastErrorMessage = null;
    this.isBackfillRunning = true;

    const runBackfillService =
      this.createRunBackfillService(targetWalletAddress);

    void runBackfillService
      .runBackfill(BigInt(startBlock), BigInt(endBlock), Number(batchSize))
      .catch((error) => {
        this.lastErrorMessage =
          error instanceof Error ? error.message : "Unknown error";

        this.logger.error(
          `Backfill failed: ${this.lastErrorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );

        return;
      })
      .finally(() => {
        this.isBackfillRunning = false;
      });

    return {
      ok: true,
      message: "Backfill started",
    };
  }

  private createTransferEventService(
    targetWalletAddress: string,
  ): TransferEventService {
    const transferEventSaveService = new TransferEventSaveService(
      this.transactionRepository,
      this.transferEventRepository,
    );

    const transferEventIndexerService = new TransferEventIndexerService(
      this.transferEventDecoder,
      this.transactionReader,
      transferEventSaveService,
      targetWalletAddress,
    );

    return new TransferEventService(
      this.logReader,
      transferEventIndexerService,
    );
  }

  private createRunBackfillService(
    targetWalletAddress: string,
  ): RunBackfillService {
    const transferEventService =
      this.createTransferEventService(targetWalletAddress);

    const blockBatchProcessor = new BlockBatchProcessor(
      transferEventService,
      this.checkpointService,
    );

    return new RunBackfillService(this.checkpointService, blockBatchProcessor);
  }
}
