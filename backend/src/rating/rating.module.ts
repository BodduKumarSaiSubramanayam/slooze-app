import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingResolver } from './rating.resolver';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [RatingService, RatingResolver],
})
export class RatingModule { }
