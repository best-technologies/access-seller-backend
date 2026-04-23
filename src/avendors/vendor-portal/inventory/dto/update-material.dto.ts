import { PartialType } from '@nestjs/swagger';
import { CreateVendorInventoryMaterialDto } from './create-material.dto';

export class UpdateVendorInventoryMaterialDto extends PartialType(
  CreateVendorInventoryMaterialDto,
) {}
