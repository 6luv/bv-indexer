import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";
import { PostgresCheckpointRepository } from "@/checkpoint/infrastructure/database/postgres-checkpoint.repository";
import { prisma } from "@/shared/database/prisma-client";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

describe("PostgresCheckpointRepository", () => {
  let repository: PostgresCheckpointRepository;

  beforeEach(async () => {
    repository = new PostgresCheckpointRepository();
    await prisma.checkpoint.deleteMany();
  });

  afterAll(async () => {
    await prisma.checkpoint.deleteMany();
    await prisma.$disconnect();
  });

  it("체크포인트를 저장하고 type으로 조회할 수 있어야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    // When
    await repository.save(checkpoint);
    const result = await repository.findByType(CheckpointType.BACKFILL);

    // Then
    expect(result).not.toBeNull();
    expect(result?.getType()).toBe(CheckpointType.BACKFILL);
    expect(result?.getLastProcessedBlock()).toBe(100n);
    expect(result?.getUpdatedAt()).toBeGreaterThan(0);
  });

  it("존재하지 않는 type을 조회하면 null을 반환해야 한다.", async () => {
    // When
    const result = await repository.findByType(CheckpointType.BACKFILL);

    // Then
    expect(result).toBeNull();
  });

  it("체크포인트를 수정할 수 있어야 한다.", async () => {
    // Given
    const savedCheckpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    await repository.save(savedCheckpoint);

    const updatedCheckpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      200n,
      Math.floor(Date.now() / 1000),
    );

    // When
    await repository.update(updatedCheckpoint);
    const result = await repository.findByType(CheckpointType.BACKFILL);

    // Then
    expect(result).not.toBeNull();
    expect(result?.getType()).toBe(CheckpointType.BACKFILL);
    expect(result?.getLastProcessedBlock()).toBe(200n);
  });

  it("체크포인트를 삭제할 수 있어야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    await repository.save(checkpoint);

    // When
    await repository.delete(CheckpointType.BACKFILL);
    const result = await repository.findByType(CheckpointType.BACKFILL);

    // Then
    expect(result).toBeNull();
  });

  it("BACKFILL과 FORWARDFILL 체크포인트를 따로 저장할 수 있어야 한다.", async () => {
    // Given
    const backfillCheckpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    const forwardfillCheckpoint = Checkpoint.create(
      CheckpointType.FORWARDFILL,
      200n,
      Math.floor(Date.now() / 1000),
    );

    // When
    await repository.save(backfillCheckpoint);
    await repository.save(forwardfillCheckpoint);

    const backfillResult = await repository.findByType(CheckpointType.BACKFILL);
    const forwardfillResult = await repository.findByType(
      CheckpointType.FORWARDFILL,
    );

    // Then
    expect(backfillResult?.getType()).toBe(CheckpointType.BACKFILL);
    expect(backfillResult?.getLastProcessedBlock()).toBe(100n);

    expect(forwardfillResult?.getType()).toBe(CheckpointType.FORWARDFILL);
    expect(forwardfillResult?.getLastProcessedBlock()).toBe(200n);
  });

  it("BACKFILL을 삭제해도 FORWARDFILL은 남아 있어야 한다.", async () => {
    // Given
    await repository.save(
      Checkpoint.create(
        CheckpointType.BACKFILL,
        100n,
        Math.floor(Date.now() / 1000),
      ),
    );
    await repository.save(
      Checkpoint.create(
        CheckpointType.FORWARDFILL,
        200n,
        Math.floor(Date.now() / 1000),
      ),
    );

    // When
    await repository.delete(CheckpointType.BACKFILL);

    const backfillResult = await repository.findByType(CheckpointType.BACKFILL);
    const forwardfillResult = await repository.findByType(
      CheckpointType.FORWARDFILL,
    );

    // Then
    expect(backfillResult).toBeNull();
    expect(forwardfillResult?.getType()).toBe(CheckpointType.FORWARDFILL);
    expect(forwardfillResult?.getLastProcessedBlock()).toBe(200n);
  });
});
