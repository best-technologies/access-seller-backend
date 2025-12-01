import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { AiBookSubjectController } from './ai-book-subject.controller';
import { AiBookSubjectService } from './ai-book-subject.service';

@Module({
    imports: [SharedModule],
    controllers: [AiBookSubjectController],
    providers: [AiBookSubjectService],
    exports: [AiBookSubjectService]
})
export class AiBookSubjectModule {}


