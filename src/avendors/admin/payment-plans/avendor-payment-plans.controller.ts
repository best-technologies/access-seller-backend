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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { AvendorPlatformGuard } from '../../shared/guards/avendor-platform.guard';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { ListPaymentPlansQueryDto } from './dto/list-payment-plans-query.dto';
import { UpdatePaymentPlanDto } from './dto/update-payment-plan.dto';
import { AvendorPaymentPlansService } from './avendor-payment-plans.service';

type AdminCaller = { id: string; role: string };

@ApiTags('A-Vendor — Payment plans')
@ApiBearerAuth()
@Controller('avendor/payment-plans')
@UseGuards(JwtGuard, AvendorPlatformGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AvendorPaymentPlansController {
  constructor(private readonly service: AvendorPaymentPlansService) {}

  private callerFrom(user: { id: string; role: string }): AdminCaller {
    return { id: user.id, role: user.role };
  }

  @Get()
  async list(
    @GetUser() user: { id: string; role: string },
    @Query() query: ListPaymentPlansQueryDto,
  ) {
    return this.service.listPlans(query, this.callerFrom(user));
  }

  @Get(':id')
  async get(
    @GetUser() user: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.service.getPlan(id, this.callerFrom(user));
  }

  @Post()
  async create(
    @GetUser() user: { id: string; role: string },
    @Body() dto: CreatePaymentPlanDto,
  ) {
    return this.service.createPlan(dto, this.callerFrom(user));
  }

  @Patch(':id')
  async update(
    @GetUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: UpdatePaymentPlanDto,
  ) {
    return this.service.updatePlan(id, dto, this.callerFrom(user));
  }

  @Delete(':id')
  async remove(
    @GetUser() user: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.service.deletePlan(id, this.callerFrom(user));
  }
}
