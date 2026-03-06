import { Resolver, Query, Args } from '@nestjs/graphql';
import { RestaurantService } from './restaurant.service';
import { Restaurant } from './restaurant.models';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => Restaurant)
export class RestaurantResolver {
    constructor(private readonly restaurantService: RestaurantService) { }

    @Query(() => [Restaurant])
    @UseGuards(GqlAuthGuard)
    async restaurants(@CurrentUser() user: any) {
        // Re-BAC: If user is Admin, they can see all. Otherwise, only their country.
        if (user.role === 'ADMIN') {
            return this.restaurantService.findAll();
        }
        return this.restaurantService.findAll(user.country);
    }

    @Query(() => Restaurant, { nullable: true })
    @UseGuards(GqlAuthGuard)
    async restaurant(@Args('id') id: string, @CurrentUser() user: any) {
        const restaurant = await this.restaurantService.findOne(id);
        if (!restaurant) return null;

        // Re-BAC Check
        if (user.role !== 'ADMIN' && restaurant.country !== user.country) {
            throw new Error("You don't have access to this region's restaurants.");
        }

        return restaurant;
    }
}
