import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from '../../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AiBookCategoryService } from './ai-book-category.service';
import { CreateAiBookCategoryDto } from '../dto/create-ai-book-category.dto';
import { UpdateAiBookCategoryDto } from '../dto/update-ai-book-category.dto';

@Controller('admin/ai-books/categories')
@UseGuards(JwtGuard)
@Roles('admin')
export class AiBookCategoryController {
    constructor(private readonly aiBookCategoryService: AiBookCategoryService) {}

    @Get()
    getAllCategories() {
        return this.aiBookCategoryService.getAllCategories();
    }

    @Post()
    createCategory(@Body() body: CreateAiBookCategoryDto, @Request() req: any) {
        return this.aiBookCategoryService.createCategory(body, req);
    }

    @Patch(':id')
    updateCategory(
        @Param('id') id: string,
        @Body() body: UpdateAiBookCategoryDto,
        @Request() req: any
    ) {
        return this.aiBookCategoryService.updateCategory(id, body, req);
    }

    @Patch(':id/status')
    updateCategoryStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.aiBookCategoryService.updateCategoryStatus(id, status);
    }
}


