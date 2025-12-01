import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { AiBookClassController } from './ai-book-class.controller';
import { AiBookClassService } from './ai-book-class.service';

@Module({
    imports: [SharedModule],
    controllers: [AiBookClassController],
    providers: [AiBookClassService],
    exports: [AiBookClassService]
})
export class AiBookClassModule {}


