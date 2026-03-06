import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class MenuItem {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field(() => Float)
    price: number;

    @Field()
    category: string;

    @Field()
    restaurantId: string;
}

@ObjectType()
export class Restaurant {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    country: string;

    @Field()
    category: string;

    @Field(() => [MenuItem], { nullable: true })
    menuItems?: MenuItem[];
}
