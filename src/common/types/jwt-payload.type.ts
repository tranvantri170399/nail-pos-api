export interface JwtPayload {
  sub: number;
  id: number;
  name: string;
  role: string;
  type: 'staff' | 'owner';
  salonId: number;
  iat?: number;
  exp?: number;
}
