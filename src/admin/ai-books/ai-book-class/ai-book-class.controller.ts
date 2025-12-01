import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AiBookClassService } from './ai-book-class.service';

@Controller('admin/ai-books/classes')
@UseGuards(JwtGuard)
@Roles('admin')
export class AiBookClassController {
    constructor(private readonly aiBookClassService: AiBookClassService) {}

    @Get()
    getAllClasses() {
        return this.aiBookClassService.getAllClasses();
    }

    @Post()
    createClass(@Body() body: any) {
        return this.aiBookClassService.createClass(body);
    }

    @Patch(':id/status')
    updateClassStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.aiBookClassService.updateClassStatus(id, status);
    }
}


