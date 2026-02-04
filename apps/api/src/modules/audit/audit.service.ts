import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: {
    actor_user_id?: string;
    action: AuditAction;
    entity: string;
    entity_id: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          ...data,
          old_values: data.old_values ? JSON.stringify(data.old_values) : null,
          new_values: data.new_values ? JSON.stringify(data.new_values) : null,
        },
      });

      this.logger.debug(
        `Audit log created: ${data.action} on ${data.entity}:${data.entity_id}`
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async findByEntity(entity: string, entityId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entity,
        entity_id: entityId,
      },
      include: {
        actor_user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        actor_user_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });
  }

  async findAll(page = 1, limit = 50, entity?: string, action?: string) {
    const skip = (page - 1) * limit;

    const where = {
      ...(entity && { entity }),
      ...(action && { action: action as AuditAction }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor_user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
