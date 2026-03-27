import { ApiPropertyOptional } from '@nestjs/swagger';
import { AvendorModuleAccessLevel } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateAvendorPermissionDto {
  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  vendors_management?: AvendorModuleAccessLevel;

  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  inventory?: AvendorModuleAccessLevel;

  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  rfqs?: AvendorModuleAccessLevel;

  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  order_management?: AvendorModuleAccessLevel;

  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  invoice?: AvendorModuleAccessLevel;

  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  payment?: AvendorModuleAccessLevel;

  @ApiPropertyOptional({ enum: AvendorModuleAccessLevel })
  @IsOptional()
  @IsEnum(AvendorModuleAccessLevel)
  onboarding?: AvendorModuleAccessLevel;
}
