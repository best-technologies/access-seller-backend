import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DepotModule } from './depot/depot.module';

@Module({
  providers: [CategoryService],
  controllers: [CategoryController],
  imports: [DepotModule]
})
export class CategoryModule {}
