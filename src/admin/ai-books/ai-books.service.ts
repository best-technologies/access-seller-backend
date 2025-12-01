import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class AiBooksService {
    private readonly logger = new Logger(AiBooksService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getDashboard() {
        this.logger.log('Fetching AI books dashboard data...');

        try {
            const prisma = this.prisma as any;

            // Get all AI books with relations
            const allBooks = await prisma.aiBook.findMany({
                include: {
                    subject: true,
                    category: true,
                    class: true
                },
                orderBy: { enrollmentTotal: 'desc' }
            });

            // Get all categories, subjects, and classes for metadata
            const allCategories = await prisma.aiBookCategory.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' }
            });

            const allSubjects = await prisma.aiBookSubject.findMany({
                where: { isActive: true },
                include: {
                    category: true,
                    class: true
                },
                orderBy: { createdAt: 'desc' }
            });

            const allClasses = await prisma.aiBookClass.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' }
            });

            // Calculate stats
            const totalTextbooks = allBooks.length;
            const totalEnrollments = allBooks.reduce((sum: number, book: any) => sum + (book.enrollmentTotal || 0), 0);
            const activeAiBooks = allBooks.filter((book: any) => book.aiReady === true || book.aiStatus === 'READY').length;

            // Find most enrolled textbook
            const mostEnrolledBook = allBooks.length > 0 ? allBooks[0] : null;
            const mostEnrolledTextbook = mostEnrolledBook ? {
                id: mostEnrolledBook.bookCode,
                title: mostEnrolledBook.title,
                subject: mostEnrolledBook.subject?.name || 'N/A',
                category: mostEnrolledBook.category?.code?.toLowerCase() || 'N/A',
                classLevel: mostEnrolledBook.class?.name || 'N/A',
                enrollments: mostEnrolledBook.enrollmentTotal || 0,
                aiReady: mostEnrolledBook.aiReady || false
            } : null;

            // Category breakdown - build from all categories, then add book counts
            const categoryMap = new Map<string, { key: string; label: string; books: number; enrollments: number }>();

            // Initialize with all categories
            allCategories.forEach((category: any) => {
                const categoryCode = category.code?.toLowerCase() || category.name?.toLowerCase() || 'other';
                const categoryName = this.formatCategoryLabel(category.name || category.code || 'Other');

                categoryMap.set(categoryCode, {
                    key: categoryCode,
                    label: categoryName,
                    books: 0,
                    enrollments: 0
                });
            });

            // Add book counts to categories
            allBooks.forEach((book: any) => {
                if (book.category) {
                    const categoryCode = book.category.code?.toLowerCase() || book.category.name?.toLowerCase() || 'other';
                    
                    if (categoryMap.has(categoryCode)) {
                        const categoryData = categoryMap.get(categoryCode)!;
                        categoryData.books += 1;
                        categoryData.enrollments += book.enrollmentTotal || 0;
                    } else {
                        // Category exists in book but not in categories list
                        const categoryName = this.formatCategoryLabel(book.category.name || book.category.code || 'Other');
                        categoryMap.set(categoryCode, {
                            key: categoryCode,
                            label: categoryName,
                            books: 1,
                            enrollments: book.enrollmentTotal || 0
                        });
                    }
                }
            });

            const categoryBreakdown = Array.from(categoryMap.values());

            // AI textbooks list (limit to 10 for dashboard)
            const aiTextbooks = allBooks
                .filter((book: any) => book.aiReady === true || book.aiStatus === 'READY')
                .slice(0, 10)
                .map((book: any) => ({
                    id: book.bookCode,
                    title: book.title,
                    subject: book.subject?.name || 'N/A',
                    thumbnail: book.coverImageUrl || '/images/book-images/default.jpg',
                    category: book.category?.code?.toLowerCase() || 'N/A',
                    classLevel: book.class?.name || 'N/A',
                    status: book.aiStatus === 'READY' ? 'active' : book.aiStatus?.toLowerCase() || 'draft',
                    enrollments: book.enrollmentTotal || 0,
                    totalChapters: book.chunkCount || 0,
                    aiReady: book.aiReady || false,
                    avgSessionLengthMin: 25, // Default value, can be calculated from actual session data if available
                    interactions: book.aiInteractionsTotal || 0
                }));

            // Metadata breakdown
            const metadata = {
                categories: {
                    total: allCategories.length,
                    active: allCategories.filter((c: any) => c.isActive).length,
                    breakdown: allCategories.map((category: any) => ({
                        id: category.id,
                        name: this.formatText(category.name),
                        code: category.code?.toLowerCase() || null,
                        description: category.description || null,
                        isActive: category.isActive,
                        booksCount: allBooks.filter((book: any) => book.categoryId === category.id).length
                    }))
                },
                subjects: {
                    total: allSubjects.length,
                    active: allSubjects.filter((s: any) => s.isActive).length,
                    breakdown: allSubjects.map((subject: any) => ({
                        id: subject.id,
                        name: this.formatText(subject.name),
                        code: subject.code?.toLowerCase() || null,
                        description: subject.description || null,
                        isActive: subject.isActive,
                        category: subject.category ? {
                            id: subject.category.id,
                            name: this.formatText(subject.category.name),
                            code: subject.category.code?.toLowerCase() || null
                        } : null,
                        class: subject.class ? {
                            id: subject.class.id,
                            name: this.formatText(subject.class.name),
                            code: subject.class.code?.toLowerCase() || null
                        } : null,
                        booksCount: allBooks.filter((book: any) => book.subjectId === subject.id).length
                    }))
                },
                classes: {
                    total: allClasses.length,
                    active: allClasses.filter((c: any) => c.isActive).length,
                    breakdown: allClasses.map((classItem: any) => ({
                        id: classItem.id,
                        name: this.formatText(classItem.name),
                        code: classItem.code?.toLowerCase() || null,
                        description: classItem.description || null,
                        isActive: classItem.isActive,
                        booksCount: allBooks.filter((book: any) => book.classId === classItem.id).length
                    }))
                }
            };

            const dashboardData = {
                stats: {
                    totalTextbooks,
                    totalEnrollments,
                    activeAiBooks,
                    mostEnrolledTextbook
                },
                category_breakdown: categoryBreakdown,
                ai_textbooks: aiTextbooks,
                metadata
            };

            this.logger.log('AI books dashboard data fetched successfully');

            return new ApiResponse(
                true,
                'AI books dashboard loaded',
                dashboardData
            );
        } catch (error) {
            this.logger.error('Error fetching AI books dashboard', error);
            return new ApiResponse(false, 'Error fetching AI books dashboard');
        }
    }

    private formatText(value?: string | null): string | null | undefined {
        if (!value) {
            return value;
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    private formatCategoryLabel(name: string): string {
        if (!name) return 'Other';
        
        const lowerName = name.toLowerCase();
        
        // Map common category codes/names to labels
        const categoryMap: Record<string, string> = {
            'nur': 'Nursery',
            'nursery': 'Nursery',
            'kg': 'Kindergarten',
            'kindergarten': 'Kindergarten',
            'pry': 'Primary',
            'primary': 'Primary',
            'jss': 'Junior Secondary',
            'junior secondary': 'Junior Secondary',
            'ss': 'Senior Secondary',
            'senior secondary': 'Senior Secondary'
        };

        if (categoryMap[lowerName]) {
            return categoryMap[lowerName];
        }

        // Capitalize first letter of each word
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}


