import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private client = jwksClient({
    jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 min
  });

  private getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    if (!header.kid) {
      return callback(new Error('No KID in token'), undefined);
    }

    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return callback(err, undefined);
      }

      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          this.getKey.bind(this),
          {
            algorithms: ['ES256', 'RS256'], // 🔥 future-proof
          },
          (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
          },
        );
      });

      request.user = { ...decoded as any, id: (decoded as any).sub };
      return true;
    } catch (error: any) {
      console.error('JWT ERROR:', error.message);

      if (error.message.includes('expired')) {
        throw new UnauthorizedException('Token expired');
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}