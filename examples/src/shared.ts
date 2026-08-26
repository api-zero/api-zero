/** Types shared by the documentation examples. */
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
