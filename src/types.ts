export interface Product {
  id: string;
  brand: string;
  name: string;
  spec: string;
  price: number;
  currency: string;
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock';
  imageUrl: string;
  categoryId: string;
  categoryName?: string;
  isFeatured?: boolean;
  isAccessory?: boolean;
  isBestSeller?: boolean;
  oldPrice?: number;
}
