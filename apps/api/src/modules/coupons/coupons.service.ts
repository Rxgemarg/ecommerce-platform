import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AuditService } from '../audit/audit.service';
import { slugify } from '../../common/utils/slugify.util';

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createCouponDto: CreateCouponDto, userId: string) {
    const { code, type, value, minimum_amount, usage_limit, expires_at } =
      createCouponDto;

    // Check if code already exists
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon with this code already exists');
    }

    // Validate coupon data
    this.validateCouponData(type, value, minimum_amount, usage_limit);

    const coupon = await this.prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minimum_amount,
        usage_limit,
        expires_at: expires_at ? new Date(expires_at) : null,
      },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'CREATE',
      entity: 'coupons',
      entity_id: coupon.id,
      new_values: coupon,
    });

    return coupon;
  }

  async findAll(page = 1, limit = 10, search?: string, active?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [{ code: { contains: search, mode: 'insensitive' as const } }];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto, userId: string) {
    const oldCoupon = await this.findOne(id);

    // Validate coupon data if provided
    if (
      updateCouponDto.type !== undefined ||
      updateCouponDto.value !== undefined
    ) {
      const type = updateCouponDto.type || oldCoupon.type;
      const value = updateCouponDto.value || oldCoupon.value;
      const minimum_amount =
        updateCouponDto.minimum_amount || oldCoupon.minimum_amount;
      const usage_limit = updateCouponDto.usage_limit || oldCoupon.usage_limit;

      this.validateCouponData(
        type,
        value,
        minimum_amount ?? undefined,
        usage_limit ?? undefined
      );
    }

    // Check code uniqueness if being updated
    if (
      updateCouponDto.code &&
      updateCouponDto.code.toUpperCase() !== oldCoupon.code
    ) {
      const existingCoupon = await this.prisma.coupon.findUnique({
        where: { code: updateCouponDto.code.toUpperCase() },
      });

      if (existingCoupon) {
        throw new ConflictException('Coupon with this code already exists');
      }
    }

    const updateData = {
      ...updateCouponDto,
      ...(updateCouponDto.code && { code: updateCouponDto.code.toUpperCase() }),
      ...(updateCouponDto.expires_at && {
        expires_at: new Date(updateCouponDto.expires_at),
      }),
    };

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'UPDATE',
      entity: 'coupons',
      entity_id: id,
      old_values: oldCoupon,
      new_values: updatedCoupon,
    });

    return updatedCoupon;
  }

  async remove(id: string, userId: string) {
    const coupon = await this.findOne(id);

    // Check if coupon is used in any orders
    const orderCount = await this.prisma.order.count({
      where: { coupon_id: id },
    });

    if (orderCount > 0) {
      throw new BadRequestException(
        `Cannot delete coupon with ${orderCount} associated orders. Consider deactivating it instead.`
      );
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'DELETE',
      entity: 'coupons',
      entity_id: id,
      old_values: coupon,
    });

    return coupon;
  }

  async validateCoupon(code: string, orderSubtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.active) {
      throw new BadRequestException('Coupon is inactive');
    }

    if (coupon.expires_at && coupon.expires_at < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      throw new BadRequestException('Coupon usage limit exceeded');
    }

    if (coupon.minimum_amount && orderSubtotal < coupon.minimum_amount) {
      throw new BadRequestException(
        `Minimum order amount of $${coupon.minimum_amount} required for this coupon`
      );
    }

    let discountAmount = 0;

    if (coupon.type === 'PERCENTAGE') {
      discountAmount = orderSubtotal * (coupon.value / 100);
    } else {
      discountAmount = coupon.value;
    }

    if (discountAmount > orderSubtotal) {
      discountAmount = orderSubtotal;
    }

    return {
      coupon,
      discount_amount: discountAmount,
    };
  }

  private validateCouponData(
    type: string,
    value: number,
    minimum_amount?: number,
    usage_limit?: number
  ): void {
    const validTypes = ['PERCENTAGE', 'FIXED_AMOUNT'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Invalid coupon type. Must be one of: ${validTypes.join(', ')}`
      );
    }

    if (value <= 0) {
      throw new BadRequestException('Coupon value must be greater than 0');
    }

    if (type === 'PERCENTAGE' && value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    if (minimum_amount !== undefined && minimum_amount < 0) {
      throw new BadRequestException('Minimum amount cannot be negative');
    }

    if (usage_limit !== undefined && usage_limit <= 0) {
      throw new BadRequestException('Usage limit must be greater than 0');
    }
  }
}
