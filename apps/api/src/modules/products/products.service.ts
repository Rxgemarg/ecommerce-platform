import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';
import { ProductTypesService } from '../product-types/product-types.service';
import { slugify } from '../../common/utils/slugify.util';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private productTypesService: ProductTypesService
  ) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    const {
      type_id,
      title,
      description,
      base_price,
      currency = 'USD',
      sku_base,
      attributes_json,
      seo_title,
      seo_description,
      meta_tags,
    } = createProductDto;

    // Validate product type exists
    const productType = await this.prisma.productType.findUnique({
      where: { id: type_id },
    });

    if (!productType) {
      throw new NotFoundException('Product type not found');
    }

    // Validate attributes against schema
    if (attributes_json) {
      this.productTypesService.validateProductAttributes(
        productType.schema_json,
        attributes_json
      );
    }

    // Generate slug
    const slug = slugify(title);

    // Check if slug already exists for this product type
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        type_id_slug: {
          type_id,
          slug,
        },
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        'Product with this slug already exists for this type'
      );
    }

    const product = await this.prisma.product.create({
      data: {
        type_id,
        title,
        slug,
        description,
        base_price,
        currency,
        sku_base,
        attributes_json: attributes_json
          ? typeof attributes_json === 'string'
            ? attributes_json
            : JSON.stringify(attributes_json)
          : undefined,
        seo_title,
        seo_description,
        meta_tags: meta_tags
          ? typeof meta_tags === 'string'
            ? meta_tags
            : JSON.stringify(meta_tags)
          : undefined,
      },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'CREATE',
      entity: 'products',
      entity_id: product.id,
      new_values: product,
    });

    return product;
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    type_id?: string,
    status?: string
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { sku_base: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(type_id && { type_id }),
      ...(status && { status: status as any }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          type: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            select: {
              id: true,
              sku: true,
              title: true,
              price_override: true,
              inventory_qty: true,
              active: true,
            },
          },
          _count: {
            select: {
              variants: true,
              order_items: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        type: true,
        variants: {
          where: { active: true },
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: {
            variants: true,
            order_items: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(typeSlug: string, productSlug: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        type_id_slug: {
          type_id: typeSlug, // This will need adjustment - we need to find type by slug first
          slug: productSlug,
        },
      },
      include: {
        type: true,
        variants: {
          where: { active: true },
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: {
            variants: true,
            order_items: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const oldProduct = await this.findOne(id);

    // Validate product type if being updated
    if (updateProductDto.type_id) {
      const productType = await this.prisma.productType.findUnique({
        where: { id: updateProductDto.type_id },
      });

      if (!productType) {
        throw new NotFoundException('Product type not found');
      }

      // Validate attributes against schema if provided
      if (updateProductDto.attributes_json) {
        this.productTypesService.validateProductAttributes(
          productType.schema_json,
          updateProductDto.attributes_json
        );
      }
    }

    // Generate new slug if title is being updated
    if (updateProductDto.title && updateProductDto.title !== oldProduct.title) {
      updateProductDto.slug = slugify(updateProductDto.title);

      // Check slug uniqueness
      const typeId = updateProductDto.type_id || oldProduct.type_id;
      const existingProduct = await this.prisma.product.findUnique({
        where: {
          type_id_slug: {
            type_id: typeId,
            slug: updateProductDto.slug,
          },
        },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(
          'Product with this slug already exists for this type'
        );
      }
    }

    // Convert JSON fields to strings for Prisma
    const data: any = { ...updateProductDto };
    if (data.attributes_json && typeof data.attributes_json !== 'string') {
      data.attributes_json = JSON.stringify(data.attributes_json);
    }
    if (data.meta_tags && typeof data.meta_tags !== 'string') {
      data.meta_tags = JSON.stringify(data.meta_tags);
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        type: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'UPDATE',
      entity: 'products',
      entity_id: id,
      old_values: oldProduct,
      new_values: updatedProduct,
    });

    return updatedProduct;
  }

  async remove(id: string, userId: string) {
    const product = await this.findOne(id);

    // Check if product is in any orders
    const orderItemCount = await this.prisma.orderItem.count({
      where: { variant: { product_id: id } },
    });

    if (orderItemCount > 0) {
      throw new BadRequestException(
        `Cannot delete product with ${orderItemCount} associated order items`
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'DELETE',
      entity: 'products',
      entity_id: id,
      old_values: product,
    });

    return product;
  }

  async searchProducts(query: string, filters?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {
      status: 'ACTIVE',
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku_base: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (filters?.type_id) {
      where.type_id = filters.type_id;
    }

    if (filters?.min_price || filters?.max_price) {
      where.base_price = {};
      if (filters.min_price) where.base_price.gte = filters.min_price;
      if (filters.max_price) where.base_price.lte = filters.max_price;
    }

    // Search in attributes if schema fields are provided
    if (filters?.attributes && Object.keys(filters.attributes).length > 0) {
      const attributeConditions = Object.entries(filters.attributes).map(
        ([key, value]) => ({
          attributes_json: {
            path: [key],
            equals: value,
          },
        })
      );

      where.AND = attributeConditions;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          type: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { active: true, inventory_qty: { gt: 0 } },
            select: {
              id: true,
              sku: true,
              title: true,
              price_override: true,
              inventory_qty: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
