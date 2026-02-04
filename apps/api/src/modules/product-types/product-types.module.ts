import { Module } from '@nestjs/common';
import { ProductTypesController } from './product-types.controller';
import { ProductTypesService } from './product-types.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProductTypesController],
  providers: [ProductTypesService],
  exports: [ProductTypesService],
})
export class ProductTypesModule {}
