import { CognitoJwtVerifier } from 'aws-jwt-verify';

export interface CognitoVerifiedUser {
  sub: string;
  iss: string;
  clientId: string;
  email?: string;
  emailVerified: boolean;
  username?: string;
  role?: 'STUDENT' | 'FACULTY' | 'ADMIN';
  tokenUse: string;
  exp: number;
}

export class CognitoAuthService {
  private verifier: any;
  private userPoolId: string;
  private clientId: string;
  private expectedIssuer: string;

  constructor() {
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-1_lC9huqjL';
    this.clientId = process.env.COGNITO_CLIENT_ID || '3kv2vgpkklqtlpfom2t72dn29n';
    this.expectedIssuer = process.env.COGNITO_ISSUER || `https://cognito-idp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${this.userPoolId}`;

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.userPoolId,
      tokenUse: null, // Accepts both Cognito Access Tokens and ID Tokens
      clientId: this.clientId,
    });
  }

  /**
   * Cryptographically verifies Cognito JWT token signature, issuer, audience/client_id, expiration, and claims against Cognito JWKS.
   */
  async verifyCognitoToken(token: string): Promise<CognitoVerifiedUser> {
    try {
      const payload: any = await this.verifier.verify(token);

      const issuer = payload.iss;
      const clientId = payload.client_id || payload.aud;
      const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

      // Explicit validation of issuer
      if (issuer !== this.expectedIssuer) {
        throw new Error('Token issuer mismatch');
      }

      // Explicit validation of audience / client ID
      if (clientId !== this.clientId) {
        throw new Error('Token client_id / audience mismatch');
      }

      return {
        sub: payload.sub,
        iss: issuer,
        clientId,
        email: payload.email || (payload.username && payload.username.includes('@') ? payload.username : undefined),
        emailVerified,
        username: payload.username || payload['cognito:username'] || payload.sub,
        role: payload['custom:role'] ? payload['custom:role'].toUpperCase() : undefined,
        tokenUse: payload.token_use,
        exp: payload.exp,
      };
    } catch (error: any) {
      throw new Error(`Cognito verification failed: ${error.message || error}`);
    }
  }
}

export const cognitoService = new CognitoAuthService();
