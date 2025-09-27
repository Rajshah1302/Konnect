export interface User {
  id: string;
  latitude: number;
  longitude: number;
  avatarUrl?: string;
  [key: string]: any;
}
