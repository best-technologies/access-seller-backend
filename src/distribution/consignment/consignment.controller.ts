import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsignmentService } from './consignment.service';
import { CreateConsignmentDto } from './dto/create-consignment.dto';
import { AddConsignmentItemDto } from './dto/add-consignment-item.dto';
import { UpdateConsignmentItemDto } from './dto/update-consignment-item.dto';
import { ListConsignmentsQueryDto } from './dto/list-consignments-query.dto';
import { UpdateConsignmentStatusDto } from './dto/update-consignment-status.dto';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator/get-user-decorator';

@Controller('distribution/consignment')
@UseGuards(JwtGuard)
export class ConsignmentController {
  constructor(private readonly consignmentService: ConsignmentService) {}

  @Post()
  create(
    @Body() dto: CreateConsignmentDto,
    @GetUser() user: { id: string },
  ) {
    return this.consignmentService.create(dto, user?.id);
  }

  @Get()
  findAll(@Query() query: ListConsignmentsQueryDto) {
    return this.consignmentService.findAll(query);
  }

  @Post(':id/items')
  addItem(
    @Param('id') consignmentId: string,
    @Body() dto: AddConsignmentItemDto,
  ) {
    return this.consignmentService.addItem(consignmentId, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') consignmentId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateConsignmentItemDto,
  ) {
    return this.consignmentService.updateItem(consignmentId, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  deleteItem(
    @Param('id') consignmentId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.consignmentService.deleteItem(consignmentId, itemId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateConsignmentStatusDto,
  ) {
    return this.consignmentService.updateStatus(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consignmentService.findOne(id);
  }
}
