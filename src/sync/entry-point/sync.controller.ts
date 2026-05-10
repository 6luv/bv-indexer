import { Controller, Get, Post, Body, Inject, Logger } from "@nestjs/common";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "@/transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { RunForwardfillService } from "../application/run-forwardfill.service";
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

  private isForwardfillRunning = false;

  private activeForwardfillService: RunForwardfillService | null = null;
  private currentTargetWalletAddress: string | null = null;
  private forwardfillPollingIntervalMs: number | null = null;
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

    const forwardfillCheckpoint =
      await this.checkpointService.getCheckpointByType(
        CheckpointType.FORWARDFILL,
      );

    const latestBlock = await this.blockReader.getLatestBlockNumber();
    const savedTransactionCount = await this.transactionRepository.count();
    const savedTransferEventCount = await this.transferEventRepository.count();

    return {
      targetWalletAddress: this.currentTargetWalletAddress,

      latestBlock: Number(latestBlock),

      forwardfill: {
        status: this.isForwardfillRunning ? "RUNNING" : "IDLE",
        pollingIntervalMs: this.forwardfillPollingIntervalMs,
        lastProcessedBlock: forwardfillCheckpoint
          ? Number(forwardfillCheckpoint.getLastProcessedBlock())
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

  @Post("forwardfill")
  async forwardfill(@Body() body: any) {
    const { targetWalletAddress, pollingIntervalMs } = body;

    if (!targetWalletAddress) {
      return {
        ok: false,
        message: "targetWalletAddress is required",
      };
    }

    if (this.isForwardfillRunning) {
      return {
        ok: false,
        message: "Forwardfill is already running",
      };
    }

    this.currentTargetWalletAddress = targetWalletAddress;
    this.forwardfillPollingIntervalMs = Number(pollingIntervalMs ?? 3000);

    this.lastErrorMessage = null;
    this.isForwardfillRunning = true;

    const runForwardfillService = this.createRunForwardfillService(
      targetWalletAddress,
      Number(pollingIntervalMs ?? 3000),
    );

    this.activeForwardfillService = runForwardfillService;

    void runForwardfillService
      .runForwardfill()
      .catch((error) => {
        this.lastErrorMessage =
          error instanceof Error ? error.message : "Unknown error";

        this.logger.error(
          `Forwardfill failed: ${this.lastErrorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );

        return;
      })
      .finally(() => {
        this.isForwardfillRunning = false;
        this.activeForwardfillService = null;
      });

    return {
      ok: true,
      message: "Forwardfill started",
    };
  }

  @Post("forwardfill/stop")
  async stopForwardfill() {
    if (!this.isForwardfillRunning || !this.activeForwardfillService) {
      return {
        ok: false,
        message: "Forwardfill is not running",
      };
    }

    this.activeForwardfillService.stop();

    return {
      ok: true,
      message: "Forwardfill stop requested",
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

  private createRunForwardfillService(
    targetWalletAddress: string,
    pollingIntervalMs: number,
  ): RunForwardfillService {
    const transferEventService =
      this.createTransferEventService(targetWalletAddress);

    const blockBatchProcessor = new BlockBatchProcessor(
      transferEventService,
      this.checkpointService,
    );

    return new RunForwardfillService(
      this.blockReader,
      this.checkpointService,
      pollingIntervalMs,
      blockBatchProcessor,
    );
  }
}
