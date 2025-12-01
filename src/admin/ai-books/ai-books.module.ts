import { Module } from '@nestjs/common';
import { AiBooksController } from './ai-books.controller';
import { AiBooksService } from './ai-books.service';
import { SharedModule } from '../../shared/shared.module';
import { AiBookCategoryModule } from './ai-book-category/ai-book-category.module';
import { AiBookSubjectModule } from './ai-book-subject/ai-book-subject.module';
import { AiBookClassModule } from './ai-book-class/ai-book-class.module';

@Module({
    imports: [
        SharedModule,
        AiBookCategoryModule,
        AiBookSubjectModule,
        AiBookClassModule
    ],
    controllers: [AiBooksController],
    providers: [AiBooksService],
    exports: [AiBooksService]
})
export class AiBooksModule {}


