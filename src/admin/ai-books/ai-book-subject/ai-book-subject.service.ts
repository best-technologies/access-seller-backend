import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { CreateAiBookSubjectDto } from './dto/create-ai-book-subject.dto';
import { UpdateAiBookSubjectDto } from './dto/update-ai-book-subject.dto';

@Injectable()
export class AiBookSubjectService {
    private readonly logger = new Logger(AiBookSubjectService.name);

    constructor(private readonly prisma: PrismaService) {}

    // Endpoint to get all AI book subjects
    // GET /admin/ai-books/subjects
    async getAllSubjects() {
        this.logger.log('Fetching all AI book subjects...');

        try {
            const prisma = this.prisma as any;
            const subjects = await prisma.aiBookSubject.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    category: true,
                    class: true
                }
            });

            const formattedSubjects = subjects.map((subject: any) => ({
                id: subject.id,
                name: this.formatText(subject.name),
                code: this.formatText(subject.code),
                description: this.formatText(subject.description),
                isActive: subject.isActive,
                createdAt: formatDate(subject.createdAt),
                updatedAt: formatDate(subject.updatedAt),
                createdByName: this.formatText(subject.createdByName),
                createdByEmail: this.formatText(subject.createdByEmail),
                categoryId: subject.categoryId,
                category: subject.category ? {
                    id: subject.category.id,
                    name: this.formatText(subject.category.name),
                    code: this.formatText(subject.category.code)
                } : null,
                classId: subject.classId,
                class: subject.class ? {
                    id: subject.class.id,
                    name: this.formatText(subject.class.name),
                    code: this.formatText(subject.class.code)
                } : null
            }));

            this.logger.log(`Total of ${formattedSubjects.length} AI book subjects found`);

            return new ApiResponse(
                true,
                'All subjects fetched successfully',
                {
                    total: formattedSubjects.length,
                    subjects: formattedSubjects
                }
            );
        } catch (error) {
            this.logger.error('Error fetching AI book subjects', error);
            return new ApiResponse(false, 'Error fetching AI book subjects');
        }
    }

    // Endpoint to create a new AI book subject
    // POST /admin/ai-books/subjects
    // Request body: { name: string, code: string, description: string, isActive: boolean }
    // Response: { id: string, name: string, description: string, isActive: boolean, createdAt: string, updatedAt: string, createdByName: string, createdByEmail: string }
    async createSubject(payload: CreateAiBookSubjectDto, req?: any) {
        this.logger.log('Attempting to create new AI book subject...');

        try {
            const prisma = this.prisma as any;
            const rawName = String(payload.name || '').trim();
            const rawCode = String(payload.code || '').trim();

            if (!rawName) {
                this.logger.warn('Subject name is required');
                return new ApiResponse(false, 'Subject name is required');
            }

            if (!rawCode) {
                this.logger.warn('Subject code is required');
                return new ApiResponse(false, 'Subject code is required');
            }

            const normalizedName = rawName.toLowerCase();
            const normalizedCode = rawCode.toLowerCase();

            const existingByName = await prisma.aiBookSubject.findUnique({
                where: { name: normalizedName }
            });

            if (existingByName) {
                this.logger.warn(`AI book subject with name "${normalizedName}" already exists`);
                return new ApiResponse(false, 'AI book subject with this name already exists');
            }

            const existingByCode = await prisma.aiBookSubject.findUnique({
                where: { code: normalizedCode }
            });

            if (existingByCode) {
                this.logger.warn(`AI book subject with code "${normalizedCode}" already exists`);
                return new ApiResponse(false, 'AI book subject with this code already exists');
            }

            // Validate categoryId if provided
            if (payload.categoryId) {
                const category = await prisma.aiBookCategory.findUnique({
                    where: { id: payload.categoryId }
                });
                if (!category) {
                    this.logger.warn(`Category with id "${payload.categoryId}" not found`);
                    return new ApiResponse(false, 'Category not found');
                }
            }

            // Validate classId if provided
            if (payload.classId) {
                const classEntity = await prisma.aiBookClass.findUnique({
                    where: { id: payload.classId }
                });
                if (!classEntity) {
                    this.logger.warn(`Class with id "${payload.classId}" not found`);
                    return new ApiResponse(false, 'Class not found');
                }
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

            const subject = await prisma.aiBookSubject.create({
                data: {
                    name: normalizedName,
                    code: normalizedCode,
                    description: payload.description ? String(payload.description).trim() : null,
                    isActive: payload.isActive ?? true,
                    createdByName,
                    createdByEmail,
                    categoryId: payload.categoryId || null,
                    classId: payload.classId || null
                },
                include: {
                    category: true,
                    class: true
                }
            });

            this.logger.log(`AI book subject created successfully: ${subject.name} (${subject.id})`);

            const formattedSubject = {
                id: subject.id,
                name: this.formatText(subject.name),
                code: this.formatText(subject.code),
                description: this.formatText(subject.description),
                isActive: subject.isActive,
                createdAt: formatDate(subject.createdAt),
                updatedAt: formatDate(subject.updatedAt),
                createdByName: this.formatText(createdByName),
                createdByEmail: this.formatText(createdByEmail),
                categoryId: subject.categoryId,
                category: subject.category ? {
                    id: subject.category.id,
                    name: this.formatText(subject.category.name),
                    code: this.formatText(subject.category.code)
                } : null,
                classId: subject.classId,
                class: subject.class ? {
                    id: subject.class.id,
                    name: this.formatText(subject.class.name),
                    code: this.formatText(subject.class.code)
                } : null
            };

            return new ApiResponse(true, 'AI book subject created successfully', formattedSubject);
        } catch (error) {
            this.logger.error('Error creating AI book subject', error);
            return new ApiResponse(false, 'Error creating AI book subject');
        }
    }

    async updateSubject(id: string, payload: UpdateAiBookSubjectDto) {
        this.logger.log(`Attempting to update AI book subject with id: ${id}`);

        try {
            const prisma = this.prisma as any;

            const existing = await prisma.aiBookSubject.findUnique({
                where: { id }
            });

            if (!existing) {
                this.logger.warn(`AI book subject with id "${id}" not found`);
                return new ApiResponse(false, 'AI book subject not found');
            }

            const data: any = {};

            if (payload.name !== undefined) {
                const rawName = String(payload.name).trim();
                if (!rawName) {
                    return new ApiResponse(false, 'Subject name cannot be empty');
                }
                const normalizedName = rawName.toLowerCase();

                const existingByName = await prisma.aiBookSubject.findFirst({
                    where: {
                        name: normalizedName,
                        NOT: { id }
                    }
                });

                if (existingByName) {
                    this.logger.warn(`AI book subject with name "${normalizedName}" already exists`);
                    return new ApiResponse(false, 'AI book subject with this name already exists');
                }

                data.name = normalizedName;
            }

            if (payload.code !== undefined) {
                const rawCode = String(payload.code).trim();
                if (!rawCode) {
                    return new ApiResponse(false, 'Subject code cannot be empty');
                }
                const normalizedCode = rawCode.toLowerCase();

                const existingByCode = await prisma.aiBookSubject.findFirst({
                    where: {
                        code: normalizedCode,
                        NOT: { id }
                    }
                });

                if (existingByCode) {
                    this.logger.warn(`AI book subject with code "${normalizedCode}" already exists`);
                    return new ApiResponse(false, 'AI book subject with this code already exists');
                }

                data.code = normalizedCode;
            }

            if (payload.description !== undefined) {
                data.description = payload.description ? String(payload.description).trim().toLowerCase() : null;
            }

            if (payload.isActive !== undefined) {
                data.isActive = payload.isActive;
            }

            // Validate and update categoryId if provided
            if (payload.categoryId !== undefined) {
                if (payload.categoryId) {
                    const category = await prisma.aiBookCategory.findUnique({
                        where: { id: payload.categoryId }
                    });
                    if (!category) {
                        this.logger.warn(`Category with id "${payload.categoryId}" not found`);
                        return new ApiResponse(false, 'Category not found');
                    }
                    data.categoryId = payload.categoryId;
                } else {
                    data.categoryId = null;
                }
            }

            // Validate and update classId if provided
            if (payload.classId !== undefined) {
                if (payload.classId) {
                    const classEntity = await prisma.aiBookClass.findUnique({
                        where: { id: payload.classId }
                    });
                    if (!classEntity) {
                        this.logger.warn(`Class with id "${payload.classId}" not found`);
                        return new ApiResponse(false, 'Class not found');
                    }
                    data.classId = payload.classId;
                } else {
                    data.classId = null;
                }
            }

            const updated = await prisma.aiBookSubject.update({
                where: { id },
                data,
                include: {
                    category: true,
                    class: true
                }
            });

            const formattedSubject = {
                id: updated.id,
                name: this.formatText(updated.name),
                code: this.formatText(updated.code),
                description: this.formatText(updated.description),
                isActive: updated.isActive,
                createdAt: formatDate(updated.createdAt),
                updatedAt: formatDate(updated.updatedAt),
                createdByName: this.formatText(updated.createdByName),
                createdByEmail: this.formatText(updated.createdByEmail),
                categoryId: updated.categoryId,
                category: updated.category ? {
                    id: updated.category.id,
                    name: this.formatText(updated.category.name),
                    code: this.formatText(updated.category.code)
                } : null,
                classId: updated.classId,
                class: updated.class ? {
                    id: updated.class.id,
                    name: this.formatText(updated.class.name),
                    code: this.formatText(updated.class.code)
                } : null
            };

            this.logger.log(`AI book subject updated successfully: ${updated.name} (${updated.id})`);
            return new ApiResponse(true, 'AI book subject updated successfully', formattedSubject);
        } catch (error) {
            this.logger.error(`Error updating AI book subject with id ${id}`, error);
            return new ApiResponse(false, 'Error updating AI book subject');
        }
    }

    async updateSubjectStatus(id: string, status: string) {
        // TODO: implement status update logic for an AI book subject
        return { success: true, id, status };
    }

    private formatText(value?: string | null): string | null | undefined {
        if (!value) {
            return value;
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}


