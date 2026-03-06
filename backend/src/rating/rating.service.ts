import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RatingService {
    constructor(private prisma: PrismaService) { }

    async rateItem(userId: string, menuItemId: string, score: number) {
        await (this.prisma as any).rating.upsert({
            where: { userId_menuItemId: { userId, menuItemId } },
            update: { score },
            create: { userId, menuItemId, score },
        });
        return this.getItemRatings(menuItemId, userId);
    }

    async getItemRatings(menuItemId: string, userId?: string) {
        const ratings: { userId: string; score: number }[] = await (this.prisma as any).rating.findMany({
            where: { menuItemId },
        });

        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0
            ? ratings.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / totalRatings
            : 0;

        const userRating = userId
            ? (ratings.find((r: { userId: string; score: number }) => r.userId === userId)?.score ?? null)
            : null;

        return { menuItemId, averageRating, totalRatings, userRating };
    }

    async getMenuItemsWithRatings(menuItemIds: string[], userId?: string) {
        return Promise.all(menuItemIds.map((id: string) => this.getItemRatings(id, userId)));
    }
}
