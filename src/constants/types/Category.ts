export interface Category {
  id: number;
  name: string;
  minBalance: number;
  prizes: number[] | null;
}