import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { EventType } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async trackEvent(data: {
    type: EventType;
    user_id?: string;
    session_id?: string;
    payload?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      await this.prisma.event.create({
        data: {
          ...data,
          payload: data.payload ? JSON.stringify(data.payload) : null,
        },
      });

      this.logger.debug(`Event tracked: ${data.type}`, {
        user_id: data.user_id,
      });
    } catch (error) {
      this.logger.error('Failed to track event', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async getDashboardKpis(dateRange?: { start: string; end: string }) {
    const where = dateRange
      ? {
          created_at: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
        }
      : {};

    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      conversionRate,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      this.getTotalRevenue(where),
      this.getTotalOrders(where),
      this.getTotalUsers(where),
      this.getConversionRate(where),
      this.getTopProducts(where),
      this.getRecentOrders(where),
    ]);

    return {
      totalRevenue,
      totalOrders,
      totalUsers,
      conversionRate,
      topProducts,
      recentOrders,
    };
  }

  async getSalesAnalytics(dateRange?: { start: string; end: string }) {
    const where = dateRange
      ? {
          created_at: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
        }
      : {};

    const [
      dailyRevenue,
      revenueByProductType,
      orderStatusBreakdown,
      topCoupons,
    ] = await Promise.all([
      this.getDailyRevenue(where),
      this.getRevenueByProductType(where),
      this.getOrderStatusBreakdown(where),
      this.getTopCoupons(where),
    ]);

    return {
      dailyRevenue,
      revenueByProductType,
      orderStatusBreakdown,
      topCoupons,
    };
  }

  async getProductAnalytics(dateRange?: { start: string; end: string }) {
    const where = dateRange
      ? {
          created_at: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
        }
      : {};

    const [topViewedProducts, topSellingProducts, conversionByType] =
      await Promise.all([
        this.getTopViewedProducts(where),
        this.getTopSellingProducts(where),
        this.getConversionByType(where),
      ]);

    return {
      topViewedProducts,
      topSellingProducts,
      conversionByType,
    };
  }

  private async getTotalRevenue(where: any): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        ...where,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
      },
      _sum: {
        total_amount: true,
      },
    });

    return Number(result._sum.total_amount || 0);
  }

  private async getTotalOrders(where: any): Promise<number> {
    return this.prisma.order.count({ where });
  }

  private async getTotalUsers(where: any): Promise<number> {
    return this.prisma.user.count({
      where: {
        created_at: where.created_at,
      },
    });
  }

  private async getConversionRate(where: any): Promise<number> {
    const [totalOrders, totalSessions] = await Promise.all([
      this.getTotalOrders(where),
      this.prisma.event.count({
        where: {
          ...where,
          type: 'PAGE_VIEW',
        },
      }),
    ]);

    return totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
  }

  private async getTopProducts(where: any) {
    const groupedItems = await this.prisma.orderItem.groupBy({
      by: ['variant_id'],
      where: {
        order: where,
      },
      _sum: {
        quantity: true,
        total_price: true,
      },
      orderBy: {
        _sum: {
          total_price: 'desc',
        },
      },
      take: 5,
    });

    // Fetch variant and product details separately
    const variantIds = groupedItems.map(item => item.variant_id);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));

    return groupedItems.map(item => ({
      ...item,
      variant: variantMap.get(item.variant_id) || null,
    }));
  }

  private async getRecentOrders(where: any) {
    return this.prisma.order.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            total_price: true,
            variant: {
              select: {
                product: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async getDailyRevenue(where: any) {
    return this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE status IN ('PAID', 'SHIPPED', 'DELIVERED')
        ${where.created_at ? Prisma.sql`AND created_at >= ${where.created_at.gte} AND created_at <= ${where.created_at.lte}` : Prisma.empty}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
  }

  private async getRevenueByProductType(where: any) {
    return this.prisma.$queryRaw`
      SELECT 
        pt.name as product_type,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN product_types pt ON p.type_id = pt.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
        ${where.created_at ? Prisma.sql`AND o.created_at >= ${where.created_at.gte} AND o.created_at <= ${where.created_at.lte}` : Prisma.empty}
      GROUP BY pt.id, pt.name
      ORDER BY revenue DESC
    `;
  }

  private async getOrderStatusBreakdown(where: any) {
    return this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });
  }

  private async getTopCoupons(where: any) {
    return this.prisma.coupon.findMany({
      where: {
        orders: {
          some: where,
        },
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        orders: {
          _count: 'desc',
        },
      },
      take: 5,
    });
  }

  private async getTopViewedProducts(where: any) {
    return this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.title,
        COUNT(*) as views
      FROM events e
      JOIN products p ON JSON_EXTRACT(e.payload_json, '$.product_id') = p.id
      WHERE e.type = 'PRODUCT_VIEW'
        ${where.created_at ? Prisma.sql`AND e.created_at >= ${where.created_at.gte} AND e.created_at <= ${where.created_at.lte}` : Prisma.empty}
      GROUP BY p.id, p.title
      ORDER BY views DESC
      LIMIT 10
    `;
  }

  private async getTopSellingProducts(where: any) {
    return this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.title,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
        ${where.created_at ? Prisma.sql`AND o.created_at >= ${where.created_at.gte} AND o.created_at <= ${where.created_at.lte}` : Prisma.empty}
      GROUP BY p.id, p.title
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
  }

  private async getConversionByType(where: any) {
    return this.prisma.$queryRaw`
      SELECT 
        pt.name as product_type,
        COUNT(DISTINCT CASE WHEN e.type = 'PRODUCT_VIEW' THEN e.session_id END) as views,
        COUNT(DISTINCT CASE WHEN e.type = 'ADD_TO_CART' THEN e.session_id END) as cart_adds,
        COUNT(DISTINCT o.id) as orders
      FROM product_types pt
      LEFT JOIN products p ON pt.id = p.type_id
      LEFT JOIN events e ON JSON_EXTRACT(e.payload_json, '$.product_id') = p.id
      LEFT JOIN orders o ON JSON_EXTRACT(e.payload_json, '$.order_id') = o.id
      WHERE pt.active = true
        ${where.created_at ? Prisma.sql`AND e.created_at >= ${where.created_at.gte} AND e.created_at <= ${where.created_at.lte}` : Prisma.empty}
      GROUP BY pt.id, pt.name
      ORDER BY orders DESC
    `;
  }
}
