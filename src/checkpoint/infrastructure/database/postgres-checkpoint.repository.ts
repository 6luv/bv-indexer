import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";
import { prisma } from "@/shared/database/prisma-client";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { CheckpointType as PrismaCheckpointType } from "@prisma/client";

function toPrismaType(type: CheckpointType): PrismaCheckpointType {
  return type === CheckpointType.BACKFILL
    ? PrismaCheckpointType.BACKFILL
    : PrismaCheckpointType.FORWARDFILL;
}

export class PostgresCheckpointRepository {
  async findByType(type: CheckpointType): Promise<Checkpoint | null> {
    const row = await prisma.checkpoint.findUnique({
      where: { type: toPrismaType(type) },
    });

    if (!row) return null;

    return Checkpoint.create(
      type,
      row.lastProcessedBlock,
      row.updatedAt.getTime(),
    );
  }

  async save(checkpoint: Checkpoint): Promise<void> {
    await prisma.checkpoint.create({
      data: {
        type: toPrismaType(checkpoint.getType()),
        lastProcessedBlock: checkpoint.getLastProcessedBlock(),
        updatedAt: new Date(checkpoint.getUpdatedAt()),
      },
    });
  }

  async update(checkpoint: Checkpoint): Promise<void> {
    await prisma.checkpoint.update({
      where: { type: toPrismaType(checkpoint.getType()) },
      data: {
        lastProcessedBlock: checkpoint.getLastProcessedBlock(),
        updatedAt: new Date(checkpoint.getUpdatedAt()),
      },
    });
  }

  async delete(type: CheckpointType): Promise<void> {
    await prisma.checkpoint.delete({
      where: { type: toPrismaType(type) },
    });
  }
}
