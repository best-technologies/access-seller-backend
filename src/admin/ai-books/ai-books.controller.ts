import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AiBooksService } from './ai-books.service';

@Controller('admin/ai-books')
@UseGuards(JwtGuard)
@Roles('admin')
export class AiBooksController {
    constructor(private readonly aiBooksService: AiBooksService) {}
}


