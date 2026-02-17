import { IsArray, IsOptional, IsString } from 'class-validator';

export class EditPermissionsDto {
  /**
   * Array of Permission IDs from the Permission table.
   * Replaces all current user permissions with this set.
   */
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
