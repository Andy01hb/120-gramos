import type { MenuItem } from '../types';

export const MENU_SEED: Omit<MenuItem, 'id'>[] = [
  // Iced Coffee
  { name: 'Brown Shaken Espresso', category: 'iced_coffee', price: 80, available: true, flavors: ['Brown Sugar Cinnamon'], hasBoba: true, isFeatured: true, sortOrder: 1, imageUrl: null },
  { name: 'Latte Caramelo', category: 'iced_coffee', price: 75, available: true, flavors: ['Caramelo'], hasBoba: true, isFeatured: true, sortOrder: 2, imageUrl: null },
  { name: 'Latte Vainilla Francesa', category: 'iced_coffee', price: 75, available: true, flavors: ['Vainilla Francesa'], hasBoba: true, isFeatured: true, sortOrder: 3, imageUrl: null },
  { name: 'Latte Clásico', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 4, imageUrl: null },
  { name: 'Latte Coco', category: 'iced_coffee', price: 75, available: true, flavors: ['Coco'], hasBoba: true, isFeatured: false, sortOrder: 5, imageUrl: null },
  { name: 'Toasted Marshmallow', category: 'iced_coffee', price: 80, available: true, flavors: ['Toasted Marshmallow'], hasBoba: true, isFeatured: false, sortOrder: 6, imageUrl: null },
  { name: 'Iced Americano', category: 'iced_coffee', price: 65, available: true, flavors: [], hasBoba: false, isFeatured: false, sortOrder: 7, imageUrl: null },
  { name: 'Butterbeer', category: 'iced_coffee', price: 85, available: true, flavors: [], hasBoba: false, isFeatured: false, sortOrder: 8, imageUrl: null },
  { name: 'Cold Brew', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 9, imageUrl: null },
  // Matcha
  { name: 'Matcha Latte', category: 'matcha', price: 75, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 10, imageUrl: null },
  { name: 'Dirty Matcha', category: 'matcha', price: 80, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 11, imageUrl: null },
  { name: 'Strawberry Matcha', category: 'matcha', price: 80, available: true, flavors: [], hasBoba: false, isFeatured: false, sortOrder: 12, imageUrl: null },
  { name: 'Matcha Coco Latte', category: 'matcha', price: 80, available: true, flavors: ['Coco'], hasBoba: true, isFeatured: false, sortOrder: 13, imageUrl: null },
  // Otras
  { name: 'Taro Latte', category: 'otras', price: 75, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 14, imageUrl: null },
  { name: 'Iced Tea', category: 'otras', price: 60, available: true, flavors: [], hasBoba: false, isFeatured: false, sortOrder: 15, imageUrl: null },
  { name: 'Café Caliente', category: 'otras', price: 50, available: true, flavors: [], hasBoba: false, isFeatured: false, sortOrder: 16, imageUrl: null },
];
