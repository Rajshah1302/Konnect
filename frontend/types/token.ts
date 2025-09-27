export interface Token {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  logoUrl?: string;
  createdAt?: Date;
  [key: string]: any;
}
