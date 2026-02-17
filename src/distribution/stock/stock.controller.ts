import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StockService } from './stock.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ListStockQueryDto } from './dto/list-stock-query.dto';
import { JwtGuard } from 'src/auth/guard';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image

@Controller('distribution/stock')
@UseGuards(JwtGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(@Query() query: ListStockQueryDto) {
    return this.stockService.findAll(query);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.stockService.search(q);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES, { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    const files = images?.filter(Boolean) ?? [];
    return this.stockService.create(dto, files);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.stockService.update(id, dto);
  }

  @Post(':id/adjust')
  adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.stockService.adjustStock(id, dto);
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES, { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  addImages(
    @Param('id') id: string,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    const files = images?.filter(Boolean) ?? [];
    return this.stockService.addImages(id, files);
  }

  @Delete(':id/images')
  removeImage(
    @Param('id') id: string,
    @Query('publicId') publicId: string,
  ) {
    return this.stockService.removeImage(id, publicId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockService.remove(id);
  }
}
