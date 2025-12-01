import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { CreateAiBookCategoryDto } from '../dto/create-ai-book-category.dto';
import { UpdateAiBookCategoryDto } from '../dto/update-ai-book-category.dto';

@Injectable()
export class AiBookCategoryService {
    private readonly logger = new Logger(AiBookCategoryService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getAllCategories() {
        this.logger.log('Fetching all AI book categories...');

        try {
            const prisma = this.prisma as any;
            const categories = await prisma.aiBookCategory.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    createdByUser: true
                }
            });

            const formattedCategories = categories.map((category: any) => {
                const createdByUser = category.createdByUser;

                const createdByName =
                    createdByUser
                        ? `${createdByUser.first_name} ${createdByUser.last_name}`.trim()
                        : category.createdByName;

                const createdByEmail =
                    createdByUser?.email ?? category.createdByEmail;

                return {
                    id: category.id,
                    name: this.formatText(category.name),
                    code: this.formatText(category.code),
                    description: this.formatText(category.description),
                    isActive: category.isActive,
                    createdAt: formatDate(category.createdAt),
                    updatedAt: formatDate(category.updatedAt),
                    createdByName: this.formatText(createdByName),
                    createdByEmail: this.formatText(createdByEmail),
                    createdByUserId: category.createdByUserId
                };
            });

            this.logger.log(`Total of ${formattedCategories.length} AI book categories found`);

            return new ApiResponse(
                true,
                'All Categories fetched successfully',
                {
                    total: formattedCategories.length,
                    categories: formattedCategories
                }
            );
        } catch (error) {
            this.logger.error('Error fetching AI book categories', error);
            return new ApiResponse(false, 'Error fetching AI book categories');
        }
    }

    async createCategory(payload: CreateAiBookCategoryDto, req?: any) {
        this.logger.log('Attempting to create new AI book category...');

        try {
            const prisma = this.prisma as any;
            const rawName = String(payload.name || '').trim();
            const rawCode = String(payload.code || '').trim();

            if (!rawName) {
                this.logger.warn('Category name is required');
                return new ApiResponse(false, 'Category name is required');
            }

            if (!rawCode) {
                this.logger.warn('Category code is required');
                return new ApiResponse(false, 'Category code is required');
            }

            const normalizedName = rawName.toLowerCase();
            const normalizedCode = rawCode.toLowerCase();

            // Check for duplicate by name
            const existingByName = await prisma.aiBookCategory.findUnique({
                where: { name: normalizedName }
            });

            if (existingByName) {
                this.logger.warn(`AI book category with name "${normalizedName}" already exists`);
                return new ApiResponse(false, 'AI book category with this name already exists');
            }

            // Check for duplicate by code
            const existingByCode = await prisma.aiBookCategory.findUnique({
                where: { code: normalizedCode }
            });

            if (existingByCode) {
                this.logger.warn(`AI book category with code "${normalizedCode}" already exists`);
                return new ApiResponse(false, 'AI book category with this code already exists');
            }

            // Resolve creator info from currently signed-in user (if available)
            let createdByUserId: string | null = null;
            let createdByName: string | null = null;
            let createdByEmail: string | null = null;

            const userEmail = req?.user?.email;
            if (userEmail) {
                const user = await prisma.user.findUnique({
                    where: { email: userEmail }
                });

                if (user) {
                    createdByUserId = user.id;
                    createdByName = `${user.first_name} ${user.last_name}`.trim();
                    createdByEmail = user.email;
                }
            }

            const category = await prisma.aiBookCategory.create({
                data: {
                    name: normalizedName,
                    code: normalizedCode,
                    description: payload.description ? String(payload.description).trim() : null,
                    isActive: payload.isActive ?? true,
                    createdByUserId,
                    createdByName,
                    createdByEmail
                }
            });

            this.logger.log(`AI book category created successfully: ${category.name} (${category.id})`);

            const formattedCategory = {
                id: category.id,
                name: this.formatText(category.name),
                code: this.formatText(category.code),
                description: this.formatText(category.description),
                isActive: category.isActive,
                createdAt: formatDate(category.createdAt),
                updatedAt: formatDate(category.updatedAt),
                createdByName: this.formatText(createdByName),
                createdByEmail: this.formatText(createdByEmail),
                createdByUserId: category.createdByUserId
            };

            return new ApiResponse(true, 'AI book category created successfully', formattedCategory);
        } catch (error) {
            this.logger.error('Error creating AI book category', error);
            return new ApiResponse(false, 'Error creating AI book category');
        }
    }

    async updateCategoryStatus(id: string, status: string) {
        // TODO: implement status update logic for an AI book category
        return { success: true, id, status };
    }

    async updateCategory(id: string, payload: UpdateAiBookCategoryDto, req?: any) {
        this.logger.log(`Attempting to update AI book category with id: ${id}`);

        try {
            const prisma = this.prisma as any;

            const existing = await prisma.aiBookCategory.findUnique({
                where: { id }
            });

            if (!existing) {
                this.logger.warn(`AI book category with id "${id}" not found`);
                return new ApiResponse(false, 'AI book category not found');
            }

            const data: any = {};

            if (payload.name !== undefined) {
                const rawName = String(payload.name).trim();
                if (!rawName) {
                    return new ApiResponse(false, 'Category name cannot be empty');
                }
                const normalizedName = rawName.toLowerCase();

                const existingByName = await prisma.aiBookCategory.findFirst({
                    where: {
                        name: normalizedName,
                        NOT: { id }
                    }
                });

                if (existingByName) {
                    this.logger.warn(`AI book category with name "${normalizedName}" already exists`);
                    return new ApiResponse(false, 'AI book category with this name already exists');
                }

                data.name = normalizedName;
            }

            if (payload.code !== undefined) {
                const rawCode = String(payload.code).trim();
                if (!rawCode) {
                    return new ApiResponse(false, 'Category code cannot be empty');
                }
                const normalizedCode = rawCode.toLowerCase();

                const existingByCode = await prisma.aiBookCategory.findFirst({
                    where: {
                        code: normalizedCode,
                        NOT: { id }
                    }
                });

                if (existingByCode) {
                    this.logger.warn(`AI book category with code "${normalizedCode}" already exists`);
                    return new ApiResponse(false, 'AI book category with this code already exists');
                }

                data.code = normalizedCode;
            }

            if (payload.description !== undefined) {
                data.description = payload.description ? String(payload.description).trim().toLowerCase() : null;
            }

            if (payload.isActive !== undefined) {
                data.isActive = payload.isActive;
            }

            const updated = await prisma.aiBookCategory.update({
                where: { id },
                data
            });

            const formattedCategory = {
                id: updated.id,
                name: this.formatText(updated.name),
                code: this.formatText(updated.code),
                description: this.formatText(updated.description),
                isActive: updated.isActive,
                createdAt: formatDate(updated.createdAt),
                updatedAt: formatDate(updated.updatedAt),
                createdByName: this.formatText(updated.createdByName),
                createdByEmail: this.formatText(updated.createdByEmail),
                createdByUserId: updated.createdByUserId
            };

            this.logger.log(`AI book category updated successfully: ${updated.name} (${updated.id})`);
            return new ApiResponse(true, 'AI book category updated successfully', formattedCategory);
        } catch (error) {
            this.logger.error(`Error updating AI book category with id ${id}`, error);
            return new ApiResponse(false, 'Error updating AI book category');
        }
    }

    private formatText(value?: string | null): string | null | undefined {
        if (!value) {
            return value;
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}


