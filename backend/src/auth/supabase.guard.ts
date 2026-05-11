import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private client = jwksClient({
    jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  })

  private getKey(header: any, callback: any) {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err, null)
      } else {
        const signingKey = key.getPublicKey()
        callback(null, signingKey)
      }
    })
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header')
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      throw new UnauthorizedException('No token found')
    }

    try {
      const decoded: any = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          this.getKey.bind(this),
          { algorithms: ['ES256'] },
          (err, decoded) => {
            if (err) reject(err)
            else resolve(decoded)
          },
        )
      })

      request.user = decoded
      return true
    } catch (error: any) {
      console.error('JWT ERROR:', error.message)
      throw new UnauthorizedException('Invalid token')
    }
  }
}