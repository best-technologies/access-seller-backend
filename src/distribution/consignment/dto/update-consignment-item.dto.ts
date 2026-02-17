import { PartialType } from '@nestjs/mapped-types';
import { AddConsignmentItemDto } from './add-consignment-item.dto';

export class UpdateConsignmentItemDto extends PartialType(AddConsignmentItemDto) {}
