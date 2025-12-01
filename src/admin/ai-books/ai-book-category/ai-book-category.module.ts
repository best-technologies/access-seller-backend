import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { AiBookCategoryController } from './ai-book-category.controller';
import { AiBookCategoryService } from './ai-book-category.service';

@Module({
    imports: [SharedModule],
    controllers: [AiBookCategoryController],
    providers: [AiBookCategoryService],
    exports: [AiBookCategoryService]
})
export class AiBookCategoryModule {}


