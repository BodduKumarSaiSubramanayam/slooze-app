import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { RatingService } from './rating.service';
import { RatingResult, RateItemInput } from './rating.models';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver()
export class RatingResolver {
    constructor(private readonly ratingService: RatingService) { }

    @Mutation(() => RatingResult)
    @UseGuards(GqlAuthGuard)
    rateMenuItem(
        @Args('input') input: RateItemInput,
        @CurrentUser() user: any,
    ) {
        const userId = user.userId || user.id;
        return this.ratingService.rateItem(userId, input.menuItemId, input.score);
    }

    @Query(() => RatingResult)
    @UseGuards(GqlAuthGuard)
    getMenuItemRating(
        @Args('menuItemId') menuItemId: string,
        @CurrentUser() user: any,
    ) {
        const userId = user.userId || user.id;
        return this.ratingService.getItemRatings(menuItemId, userId);
    }
}
