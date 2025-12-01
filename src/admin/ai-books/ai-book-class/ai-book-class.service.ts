import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { CreateAiBookClassDto } from './dto/create-ai-book-class.dto';
import { UpdateAiBookClassDto } from './dto/update-ai-book-class.dto';

@Injectable()
export class AiBookClassService {
    private readonly logger = new Logger(AiBookClassService.name);

    constructor(private readonly prisma: PrismaService) {}

    // GET /admin/ai-books/classes
    async getAllClasses() {
        this.logger.log('Fetching all AI book classes...');

        try {
            const prisma = this.prisma as any;
            const classes = await prisma.aiBookClass.findMany({
                orderBy: { createdAt: 'desc' }
            });

            const formattedClasses = classes.map((cls: any) => ({
                id: cls.id,
                name: this.formatText(cls.name),
                code: this.formatText(cls.code),
                description: this.formatText(cls.description),
                isActive: cls.isActive,
                createdAt: formatDate(cls.createdAt),
                updatedAt: formatDate(cls.updatedAt),
                createdByName: this.formatText(cls.createdByName),
                createdByEmail: this.formatText(cls.createdByEmail)
            }));

            this.logger.log(`Total of ${formattedClasses.length} AI book classes found`);

            return new ApiResponse(
                true,
                'All classes fetched successfully',
                {
                    total: formattedClasses.length,
                    classes: formattedClasses
                }
            );
        } catch (error) {
            this.logger.error('Error fetching AI book classes', error);
            return new ApiResponse(false, 'Error fetching AI book classes');
        }
    }

    // POST /admin/ai-books/classes
    async createClass(payload: CreateAiBookClassDto, req?: any) {
        this.logger.log('Attempting to create new AI book class...');

        try {
            const prisma = this.prisma as any;
            const rawName = String(payload.name || '').trim();
            const rawCode = String(payload.code || '').trim();

            if (!rawName) {
                this.logger.warn('Class name is required');
                return new ApiResponse(false, 'Class name is required');
            }

            if (!rawCode) {
                this.logger.warn('Class code is required');
                return new ApiResponse(false, 'Class code is required');
            }

            const normalizedName = rawName.toLowerCase();
            const normalizedCode = rawCode.toLowerCase();

            const existingByName = await prisma.aiBookClass.findUnique({
                where: { name: normalizedName }
            });

            if (existingByName) {
                this.logger.warn(`AI book class with name "${normalizedName}" already exists`);
                return new ApiResponse(false, 'AI book class with this name already exists');
            }

            const existingByCode = await prisma.aiBookClass.findUnique({
                where: { code: normalizedCode }
            });

            if (existingByCode) {
                this.logger.warn(`AI book class with code "${normalizedCode}" already exists`);
                return new ApiResponse(false, 'AI book class with this code already exists');
            }

            let createdByName: string | null = null;
            let createdByEmail: string | null = null;

            const userEmail = req?.user?.email;
            if (userEmail) {
                const user = await prisma.user.findUnique({
                    where: { email: userEmail }
                });

                if (user) {
                    createdByName = `${user.first_name} ${user.last_name}`.trim();
                    createdByEmail = user.email;
                }
            }

            const cls = await prisma.aiBookClass.create({
                data: {
                    name: normalizedName,
                    code: normalizedCode,
                    description: payload.description ? String(payload.description).trim() : null,
                    isActive: payload.isActive ?? true,
                    createdByName,
                    createdByEmail
                }
            });

            this.logger.log(`AI book class created successfully: ${cls.name} (${cls.id})`);

            const formattedClass = {
                id: cls.id,
                name: this.formatText(cls.name),
                code: this.formatText(cls.code),
                description: this.formatText(cls.description),
                isActive: cls.isActive,
                createdAt: formatDate(cls.createdAt),
                updatedAt: formatDate(cls.updatedAt),
                createdByName: this.formatText(createdByName),
                createdByEmail: this.formatText(createdByEmail)
            };

            return new ApiResponse(true, 'AI book class created successfully', formattedClass);
        } catch (error) {
            this.logger.error('Error creating AI book class', error);
            return new ApiResponse(false, 'Error creating AI book class');
        }
    }

    // PATCH /admin/ai-books/classes/:id
    async updateClass(id: string, payload: UpdateAiBookClassDto) {
        this.logger.log(`Attempting to update AI book class with id: ${id}`);

        try {
            const prisma = this.prisma as any;

            const existing = await prisma.aiBookClass.findUnique({
                where: { id }
            });

            if (!existing) {
                this.logger.warn(`AI book class with id "${id}" not found`);
                return new ApiResponse(false, 'AI book class not found');
            }

            const data: any = {};

            if (payload.name !== undefined) {
                const rawName = String(payload.name).trim();
                if (!rawName) {
                    return new ApiResponse(false, 'Class name cannot be empty');
                }
                const normalizedName = rawName.toLowerCase();

                const existingByName = await prisma.aiBookClass.findFirst({
                    where: {
                        name: normalizedName,
                        NOT: { id }
                    }
                });

                if (existingByName) {
                    this.logger.warn(`AI book class with name "${normalizedName}" already exists`);
                    return new ApiResponse(false, 'AI book class with this name already exists');
                }

                data.name = normalizedName;
            }

            if (payload.code !== undefined) {
                const rawCode = String(payload.code).trim();
                if (!rawCode) {
                    return new ApiResponse(false, 'Class code cannot be empty');
                }
                const normalizedCode = rawCode.toLowerCase();

                const existingByCode = await prisma.aiBookClass.findFirst({
                    where: {
                        code: normalizedCode,
                        NOT: { id }
                    }
                });

                if (existingByCode) {
                    this.logger.warn(`AI book class with code "${normalizedCode}" already exists`);
                    return new ApiResponse(false, 'AI book class with this code already exists');
                }

                data.code = normalizedCode;
            }

            if (payload.description !== undefined) {
                data.description = payload.description ? String(payload.description).trim().toLowerCase() : null;
            }

            if (payload.isActive !== undefined) {
                data.isActive = payload.isActive;
            }

            const updated = await prisma.aiBookClass.update({
                where: { id },
                data
            });

            const formattedClass = {
                id: updated.id,
                name: this.formatText(updated.name),
                code: this.formatText(updated.code),
                description: this.formatText(updated.description),
                isActive: updated.isActive,
                createdAt: formatDate(updated.createdAt),
                updatedAt: formatDate(updated.updatedAt),
                createdByName: this.formatText(updated.createdByName),
                createdByEmail: this.formatText(updated.createdByEmail)
            };

            this.logger.log(`AI book class updated successfully: ${updated.name} (${updated.id})`);
            return new ApiResponse(true, 'AI book class updated successfully', formattedClass);
        } catch (error) {
            this.logger.error(`Error updating AI book class with id ${id}`, error);
            return new ApiResponse(false, 'Error updating AI book class');
        }
    }

    async updateClassStatus(id: string, status: string) {
        // TODO: implement status update logic for an AI book class
        return { success: true, id, status };
    }

    private formatText(value?: string | null): string | null | undefined {
        if (!value) {
            return value;
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}


