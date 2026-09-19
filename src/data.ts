import { Product } from './types';
import smartphoneImg from './assets/images/product_smartphone_1788818946449.jpg';
import laptopImg from './assets/images/product_laptop_1788818957612.jpg';
import earbudsImg from './assets/images/product_earbuds_1788818969416.jpg';
import smartwatchImg from './assets/images/product_smartwatch_1788818980798.jpg';

export const products: Product[] = [
  {
    id: 'p-1',
    brand: 'Apple',
    name: 'iPhone 15 Pro Max',
    spec: '256GB • Natural Titanium',
    price: 210000,
    currency: 'KES',
    availability: 'In Stock',
    imageUrl: smartphoneImg,
    categoryId: 'phones',
  },
  {
    id: 'p-2',
    brand: 'Apple',
    name: 'MacBook Air M3',
    spec: '16GB RAM • 512GB SSD',
    price: 245000,
    currency: 'KES',
    availability: 'Low Stock',
    imageUrl: laptopImg,
    categoryId: 'laptops',
  },
  {
    id: 'p-3',
    brand: 'Apple',
    name: 'AirPods Pro',
    spec: '2nd Generation • USB-C',
    price: 36000,
    currency: 'KES',
    availability: 'In Stock',
    imageUrl: earbudsImg,
    categoryId: 'audio',
  },
  {
    id: 'p-4',
    brand: 'Apple',
    name: 'Watch Series 9',
    spec: '45mm • GPS • Midnight',
    price: 68000,
    currency: 'KES',
    availability: 'In Stock',
    imageUrl: smartwatchImg,
    categoryId: 'wearables',
  },
];
