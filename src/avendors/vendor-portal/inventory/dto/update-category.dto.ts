import { PartialType } from '@nestjs/swagger';
import { CreateVendorInventoryCategoryDto } from './create-category.dto';

export class UpdateVendorInventoryCategoryDto extends PartialType(
  CreateVendorInventoryCategoryDto,
) {}
