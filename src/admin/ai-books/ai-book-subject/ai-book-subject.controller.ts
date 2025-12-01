import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AiBookSubjectService } from './ai-book-subject.service';

@Controller('admin/ai-books/subjects')
@UseGuards(JwtGuard)
@Roles('admin')
export class AiBookSubjectController {
    constructor(private readonly aiBookSubjectService: AiBookSubjectService) {}

    @Get()
    getAllSubjects() {
        return this.aiBookSubjectService.getAllSubjects();
    }

    @Post()
    createSubject(@Body() body: any) {
        return this.aiBookSubjectService.createSubject(body);
    }

    @Patch(':id/status')
    updateSubjectStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.aiBookSubjectService.updateSubjectStatus(id, status);
    }
}


