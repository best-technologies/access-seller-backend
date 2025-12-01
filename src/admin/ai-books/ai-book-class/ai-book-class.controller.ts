import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from '../../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AiBookClassService } from './ai-book-class.service';
import { CreateAiBookClassDto } from './dto/create-ai-book-class.dto';
import { UpdateAiBookClassDto } from './dto/update-ai-book-class.dto';

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
    createClass(@Body() body: CreateAiBookClassDto, @Request() req: any) {
        return this.aiBookClassService.createClass(body, req);
    }

    @Patch(':id')
    updateClass(
        @Param('id') id: string,
        @Body() body: UpdateAiBookClassDto
    ) {
        return this.aiBookClassService.updateClass(id, body);
    }

    @Patch(':id/status')
    updateClassStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.aiBookClassService.updateClassStatus(id, status);
    }
}


