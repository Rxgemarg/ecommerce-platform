import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuditService } from '../audit/audit.service';
import { nanoid } from 'nanoid';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createOrderDto: CreateOrderDto, userId?: string) {
    const {
      items,
      shipping_address,
      billing_address,
      currency = 'USD',
      coupon_code,
      notes,
    } = createOrderDto;

    // Validate items and calculate totals
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variant_id },
        include: {
          product: {
            select: {
              title: true,
              currency: true,
              base_price: true,
            },
          },
        },
      });

      if (!variant) {
        throw new NotFoundException(
          `Product variant ${item.variant_id} not found`
        );
      }

      if (!variant.active) {
        throw new BadRequestException(
          `Product variant ${item.variant_id} is not active`
        );
      }

      if (variant.inventory_qty < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for variant ${variant.sku}. Available: ${variant.inventory_qty}, Requested: ${item.quantity}`
        );
      }

      const unitPrice = variant.price_override || variant.product.base_price;
      const totalPrice = unitPrice * item.quantity;

      orderItems.push({
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });

      subtotal += totalPrice;
    }

    // Calculate tax (10% for demo)
    const taxAmount = subtotal * 0.1;

    // Calculate shipping (flat rate for demo)
    const shippingAmount = 10.0;

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;

    if (coupon_code) {
      coupon = await this.prisma.coupon.findUnique({
        where: { code: coupon_code },
      });

      if (!coupon || !coupon.active) {
        throw new BadRequestException('Invalid or inactive coupon code');
      }

      if (coupon.expires_at && coupon.expires_at < new Date()) {
        throw new BadRequestException('Coupon code has expired');
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        throw new BadRequestException('Coupon code usage limit exceeded');
      }

      if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
        throw new BadRequestException(
          `Minimum order amount of ${coupon.minimum_amount} required for this coupon`
        );
      }

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = subtotal * (coupon.value / 100);
      } else {
        discountAmount = coupon.value;
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Create order with transaction
    const order = await this.prisma.$transaction(async tx => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          order_number: orderNumber,
          subtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          currency,
          shipping_address: shipping_address
            ? typeof shipping_address === 'string'
              ? shipping_address
              : JSON.stringify(shipping_address)
            : undefined,
          billing_address: billing_address
            ? typeof billing_address === 'string'
              ? billing_address
              : JSON.stringify(billing_address)
            : undefined,
          notes,
          coupon_id: coupon?.id,
        },
      });

      // Create order items
      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            order_id: newOrder.id,
            ...item,
          },
        });

        // Update inventory
        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: {
            inventory_qty: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update coupon usage count if applicable
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usage_count: {
              increment: 1,
            },
          },
        });
      }

      return newOrder;
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'CREATE',
      entity: 'orders',
      entity_id: order.id,
      new_values: {
        order_number: order.order_number,
        total_amount: order.total_amount,
        currency: order.currency,
      },
    });

    // Return order with items
    return this.findOne(order.id);
  }

  async findAll(
    page = 1,
    limit = 10,
    userId?: string,
    status?: string,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.user_id = userId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { order_number: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  title: true,
                  product: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          coupon: {
            select: {
              id: true,
              code: true,
              type: true,
              value: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };

    if (userId) {
      where.user_id = userId;
    }

    const order = await this.prisma.order.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    type: {
                      select: {
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string, userId?: string) {
    const where: any = { order_number: orderNumber };

    if (userId) {
      where.user_id = userId;
    }

    const order = await this.prisma.order.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string) {
    const oldOrder = await this.findOne(id);

    // Convert JSON fields to strings for Prisma
    const data: any = { ...updateOrderDto };
    if (data.shipping_address && typeof data.shipping_address !== 'string') {
      data.shipping_address = JSON.stringify(data.shipping_address);
    }
    if (data.billing_address && typeof data.billing_address !== 'string') {
      data.billing_address = JSON.stringify(data.billing_address);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data,
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'UPDATE',
      entity: 'orders',
      entity_id: id,
      old_values: { status: oldOrder.status },
      new_values: { status: updatedOrder.status },
    });

    return updatedOrder;
  }

  async updateStatus(id: string, status: string, userId: string) {
    const oldOrder = await this.findOne(id);

    const statusData: any = { status };

    // Add timestamps based on status
    if (status === 'PAID') {
      statusData.paid_at = new Date();
    } else if (status === 'SHIPPED') {
      statusData.shipped_at = new Date();
    } else if (status === 'DELIVERED') {
      statusData.delivered_at = new Date();
    } else if (status === 'CANCELLED') {
      statusData.cancelled_at = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: statusData,
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'UPDATE',
      entity: 'orders',
      entity_id: id,
      old_values: { status: oldOrder.status },
      new_values: { status: updatedOrder.status },
    });

    return updatedOrder;
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr =
      date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const randomStr = nanoid(8).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
  }
}
