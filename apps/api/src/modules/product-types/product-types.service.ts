import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductTypesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createProductTypeDto: CreateProductTypeDto, userId: string) {
    const { name, slug, schema_json, ui_schema_json, search_facets_json } =
      createProductTypeDto;

    // Validate schema structure
    this.validateSchema(schema_json);

    // Check if slug already exists
    const existingType = await this.prisma.productType.findUnique({
      where: { slug },
    });

    if (existingType) {
      throw new ConflictException('Product type with this slug already exists');
    }

    const productType = await this.prisma.productType.create({
      data: {
        name,
        slug,
        schema_json:
          typeof schema_json === 'string'
            ? schema_json
            : JSON.stringify(schema_json),
        ui_schema_json: ui_schema_json
          ? typeof ui_schema_json === 'string'
            ? ui_schema_json
            : JSON.stringify(ui_schema_json)
          : undefined,
        search_facets_json: search_facets_json
          ? typeof search_facets_json === 'string'
            ? search_facets_json
            : JSON.stringify(search_facets_json)
          : undefined,
      },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'CREATE',
      entity: 'product_types',
      entity_id: productType.id,
      new_values: productType,
    });

    return productType;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [productTypes, total] = await Promise.all([
      this.prisma.productType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { sort_order: 'asc' },
      }),
      this.prisma.productType.count({ where }),
    ]);

    return {
      productTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const productType = await this.prisma.productType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!productType) {
      throw new NotFoundException('Product type not found');
    }

    return productType;
  }

  async findBySlug(slug: string) {
    const productType = await this.prisma.productType.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!productType) {
      throw new NotFoundException('Product type not found');
    }

    return productType;
  }

  async update(
    id: string,
    updateProductTypeDto: UpdateProductTypeDto,
    userId: string
  ) {
    const oldProductType = await this.findOne(id);

    // Validate schema if provided
    if (updateProductTypeDto.schema_json) {
      this.validateSchema(updateProductTypeDto.schema_json);
    }

    // Check slug uniqueness if being updated
    if (
      updateProductTypeDto.slug &&
      updateProductTypeDto.slug !== oldProductType.slug
    ) {
      const existingType = await this.prisma.productType.findUnique({
        where: { slug: updateProductTypeDto.slug },
      });

      if (existingType) {
        throw new ConflictException(
          'Product type with this slug already exists'
        );
      }
    }

    // Convert JSON fields to strings for Prisma
    const data: any = { ...updateProductTypeDto };
    if (data.schema_json && typeof data.schema_json !== 'string') {
      data.schema_json = JSON.stringify(data.schema_json);
    }
    if (data.ui_schema_json && typeof data.ui_schema_json !== 'string') {
      data.ui_schema_json = JSON.stringify(data.ui_schema_json);
    }
    if (
      data.search_facets_json &&
      typeof data.search_facets_json !== 'string'
    ) {
      data.search_facets_json = JSON.stringify(data.search_facets_json);
    }

    const updatedProductType = await this.prisma.productType.update({
      where: { id },
      data,
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'UPDATE',
      entity: 'product_types',
      entity_id: id,
      old_values: oldProductType,
      new_values: updatedProductType,
    });

    return updatedProductType;
  }

  async remove(id: string, userId: string) {
    const productType = await this.findOne(id);

    // Check if there are products using this type
    const productCount = await this.prisma.product.count({
      where: { type_id: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete product type with ${productCount} associated products`
      );
    }

    await this.prisma.productType.delete({
      where: { id },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: userId,
      action: 'DELETE',
      entity: 'product_types',
      entity_id: id,
      old_values: productType,
    });

    return productType;
  }

  private validateSchema(schema: any): void {
    if (!schema || typeof schema !== 'object') {
      throw new BadRequestException('Schema must be a valid object');
    }

    if (!Array.isArray(schema.fields)) {
      throw new BadRequestException('Schema must contain a fields array');
    }

    // Validate each field
    for (const field of schema.fields) {
      if (!field.key || typeof field.key !== 'string') {
        throw new BadRequestException('Each field must have a valid key');
      }

      if (!field.label || typeof field.label !== 'string') {
        throw new BadRequestException('Each field must have a valid label');
      }

      if (!field.type || typeof field.type !== 'string') {
        throw new BadRequestException('Each field must have a valid type');
      }

      const validTypes = [
        'string',
        'number',
        'boolean',
        'enum',
        'date',
        'file',
        'measurement',
      ];

      if (!validTypes.includes(field.type)) {
        throw new BadRequestException(
          `Invalid field type: ${field.type}. Must be one of: ${validTypes.join(', ')}`
        );
      }

      // Validate enum type
      if (field.type === 'enum') {
        if (!Array.isArray(field.options) || field.options.length === 0) {
          throw new BadRequestException('Enum fields must have options array');
        }
      }
    }
  }

  // Method to validate product attributes against schema
  validateProductAttributes(schema: any, attributes: any): void {
    if (!schema.fields) {
      throw new BadRequestException('Invalid schema: no fields defined');
    }

    const schemaFields = schema.fields;
    const attributeKeys = Object.keys(attributes || {});

    // Check required fields
    for (const field of schemaFields) {
      if (field.required && !attributeKeys.includes(field.key)) {
        throw new BadRequestException(
          `Required field '${field.label}' is missing`
        );
      }
    }

    // Validate provided attributes
    for (const [key, value] of Object.entries(attributes || {})) {
      const field = schemaFields.find((f: any) => f.key === key);

      if (!field) {
        throw new BadRequestException(`Unknown attribute: ${key}`);
      }

      this.validateFieldValue(field, value);
    }
  }

  private validateFieldValue(field: any, value: any): void {
    const { type, required, min, max, options } = field;

    // Check required fields
    if (required && (value === null || value === undefined || value === '')) {
      throw new BadRequestException(`Field '${field.label}' is required`);
    }

    // Skip validation for optional empty fields
    if (!required && (value === null || value === undefined || value === '')) {
      return;
    }

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new BadRequestException(
            `Field '${field.label}' must be a string`
          );
        }
        if (min && value.length < min) {
          throw new BadRequestException(
            `Field '${field.label}' must be at least ${min} characters`
          );
        }
        if (max && value.length > max) {
          throw new BadRequestException(
            `Field '${field.label}' must not exceed ${max} characters`
          );
        }
        break;

      case 'number': {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new BadRequestException(
            `Field '${field.label}' must be a number`
          );
        }
        if (min !== undefined && numValue < min) {
          throw new BadRequestException(
            `Field '${field.label}' must be at least ${min}`
          );
        }
        if (max !== undefined && numValue > max) {
          throw new BadRequestException(
            `Field '${field.label}' must not exceed ${max}`
          );
        }
        break;
      }

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(
            `Field '${field.label}' must be a boolean`
          );
        }
        break;

      case 'enum':
        if (!options.includes(value)) {
          throw new BadRequestException(
            `Field '${field.label}' must be one of: ${options.join(', ')}`
          );
        }
        break;

      case 'date': {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          throw new BadRequestException(
            `Field '${field.label}' must be a valid date`
          );
        }
        break;
      }

      case 'file':
        if (typeof value !== 'string') {
          throw new BadRequestException(
            `Field '${field.label}' must be a file path/URL`
          );
        }
        break;

      case 'measurement':
        if (typeof value !== 'object' || value === null) {
          throw new BadRequestException(
            `Field '${field.label}' must be a measurement object`
          );
        }
        if (typeof value.value !== 'number') {
          throw new BadRequestException(`Measurement value must be a number`);
        }
        if (!value.unit || typeof value.unit !== 'string') {
          throw new BadRequestException(`Measurement must have a unit`);
        }
        break;
    }
  }
}
