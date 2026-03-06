import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'SECRET_KEY_NEEDS_TO_BE_IN_ENV', // Must match JwtModule secret
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email, role: payload.role, country: payload.country };
    }
}
