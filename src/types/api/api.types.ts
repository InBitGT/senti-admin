export interface ApiResponse<T> {
  code: string;
  message: string;
  data?: T;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
