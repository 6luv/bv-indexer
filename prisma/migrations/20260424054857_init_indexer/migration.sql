-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('BACKFILL', 'FORWARDFILL');

-- CreateTable
CREATE TABLE "Checkpoint" (
    "type" "CheckpointType" NOT NULL,
    "lastProcessedBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "transactions" (
    "hash" VARCHAR(66) NOT NULL,
    "from_address" VARCHAR(42) NOT NULL,
    "to_address" VARCHAR(42),
    "value" BIGINT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_hash" VARCHAR(66) NOT NULL,
    "block_timestamp" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "transfer_events" (
    "id" SERIAL NOT NULL,
    "token_address" VARCHAR(42) NOT NULL,
    "from_address" VARCHAR(42) NOT NULL,
    "to_address" VARCHAR(42) NOT NULL,
    "value" BIGINT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_timestamp" BIGINT NOT NULL,
    "transaction_hash" VARCHAR(66) NOT NULL,
    "log_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_block_number_idx" ON "transactions"("block_number");

-- CreateIndex
CREATE INDEX "transfer_events_block_number_idx" ON "transfer_events"("block_number");

-- CreateIndex
CREATE INDEX "transfer_events_from_address_idx" ON "transfer_events"("from_address");

-- CreateIndex
CREATE INDEX "transfer_events_to_address_idx" ON "transfer_events"("to_address");

-- CreateIndex
CREATE INDEX "transfer_events_token_address_idx" ON "transfer_events"("token_address");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_events_transaction_hash_log_index_key" ON "transfer_events"("transaction_hash", "log_index");

-- AddForeignKey
ALTER TABLE "transfer_events" ADD CONSTRAINT "transfer_events_transaction_hash_fkey" FOREIGN KEY ("transaction_hash") REFERENCES "transactions"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
