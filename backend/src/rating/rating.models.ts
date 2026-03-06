import { Field, ObjectType, InputType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class RatingResult {
    @Field()
    menuItemId: string;

    @Field(() => Float)
    averageRating: number;

    @Field(() => Int)
    totalRatings: number;

    @Field(() => Int, { nullable: true })
    userRating?: number;
}

@InputType()
export class RateItemInput {
    @Field()
    menuItemId: string;

    @Field(() => Int)
    score: number; // 1-5
}
