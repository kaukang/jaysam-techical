import { products } from './data';
import { Product } from './types';

// Simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getProducts: async (categoryId?: string): Promise<Product[]> => {
    await delay(500);
    if (categoryId) {
      // In a real app, this would filter by category id.
      // For now, returning all as we don't have category mapped to products yet.
      return products; 
    }
    return products;
  },
  
  getProduct: async (id: string): Promise<Product | undefined> => {
    await delay(300);
    return products.find(p => p.id === id);
  }
};
