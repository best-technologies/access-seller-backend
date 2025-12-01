import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from '../../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AiBookSubjectService } from './ai-book-subject.service';
import { CreateAiBookSubjectDto } from './dto/create-ai-book-subject.dto';
import { UpdateAiBookSubjectDto } from './dto/update-ai-book-subject.dto';

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
    createSubject(@Body() body: CreateAiBookSubjectDto, @Request() req: any) {
        return this.aiBookSubjectService.createSubject(body, req);
    }

    @Patch(':id')
    updateSubject(
        @Param('id') id: string,
        @Body() body: UpdateAiBookSubjectDto
    ) {
        return this.aiBookSubjectService.updateSubject(id, body);
    }

    @Patch(':id/status')
    updateSubjectStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.aiBookSubjectService.updateSubjectStatus(id, status);
    }
}


