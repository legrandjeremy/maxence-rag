export interface Category {
  id: number;
  code: string;
  name: string;
  genderId: number;
  minAge?: number;
  maxAge?: number;
  isOfficial: boolean;
  isLegacy: boolean;
  description?: string;
  isActive: boolean;
}

export interface CategoryOption {
  label: string;
  value: number | null;
}

export const categories: Category[] = [
  { id: 1, code: "MYO", name: "Men Youth", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 2, code: "MJU", name: "Men Juniors", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 3, code: "M23", name: "Men Under 23", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 4, code: "MEL", name: "Men Elite", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 5, code: "MMA", name: "Men Masters", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 6, code: "WYO", name: "Women Youth", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 7, code: "WJU", name: "Women Juniors", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 8, code: "WEL", name: "Women Elite", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 9, code: "WMA", name: "Women Masters", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 10, code: "AMA", name: "Amateurs", genderId: 1, isOfficial: true, isLegacy: true, isActive: true },
  { id: 11, code: "CHA", name: "Championship", genderId: 1, isOfficial: true, isLegacy: true, isActive: true },
  { id: 12, code: "MUN", name: "Men - Unknown", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 13, code: "WUN", name: "Women - Unknown", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 14, code: "MEN", name: "Men", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 15, code: "WOM", name: "Women", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 16, code: "PRO", name: "Professionals", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 17, code: "JUN", name: "Juniors", genderId: 1, isOfficial: true, isLegacy: true, isActive: true },
  { id: 18, code: "CAD", name: "Cadets", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 19, code: "MIX", name: "Coupe du Monde", genderId: 1, isOfficial: true, isLegacy: true, isActive: true },
  { id: 20, code: "MAS", name: "Masters", genderId: 1, isOfficial: true, isLegacy: true, isActive: true },
  { id: 21, code: "W23", name: "Women Under 23", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 22, code: "ME", name: "Men Elite", genderId: 2, minAge: 23, isOfficial: true, isLegacy: false, isActive: true },
  { id: 23, code: "WE", name: "Women Elite", genderId: 3, minAge: 23, isOfficial: true, isLegacy: false, isActive: true },
  { id: 24, code: "MJ", name: "Men Junior", genderId: 2, minAge: 17, maxAge: 18, isOfficial: true, isLegacy: false, isActive: true },
  { id: 25, code: "WJ", name: "Women Junior", genderId: 3, minAge: 17, maxAge: 18, isOfficial: true, isLegacy: false, isActive: true },
  { id: 26, code: "MU", name: "Men Under 23", genderId: 2, minAge: 19, maxAge: 22, isOfficial: true, isLegacy: false, isActive: true },
  { id: 27, code: "WU", name: "Women Under 23", genderId: 3, minAge: 19, maxAge: 22, isOfficial: true, isLegacy: false, isActive: true },
  { id: 28, code: "MP", name: "Men Elite UCI WorldTour", genderId: 2, minAge: 19, isOfficial: true, isLegacy: true, isActive: true },
  { id: 29, code: "MM", name: "Men Masters", genderId: 2, isOfficial: true, isLegacy: false, isActive: true },
  { id: 30, code: "WM", name: "Women Masters", genderId: 3, isOfficial: true, isLegacy: false, isActive: true },
  { id: 31, code: "AJ", name: "Juniors", genderId: 1, minAge: 17, maxAge: 18, isOfficial: true, isLegacy: false, isActive: true },
  { id: 32, code: "AG", name: "Championship", genderId: 1, isOfficial: true, isLegacy: true, isActive: true },
  { id: 33, code: "CA", name: "Cadets", genderId: 2, maxAge: 16, isOfficial: true, isLegacy: true, isActive: true },
  { id: 34, code: "AM", name: "Masters", genderId: 1, isOfficial: true, isLegacy: false, isActive: true },
  { id: 35, code: "MR", name: "Men Elite Retired", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 36, code: "WR", name: "Women Elite Retired", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 37, code: "MD", name: "Men Elite Dead", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 38, code: "WD", name: "Women Elite Dead", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 39, code: "MS", name: "Men Elite Suspendu", genderId: 2, isOfficial: true, isLegacy: true, isActive: true },
  { id: 40, code: "WS", name: "Women Elite Suspendu", genderId: 3, isOfficial: true, isLegacy: true, isActive: true },
  { id: 41, code: "MG", name: "Men", genderId: 2, isOfficial: true, isLegacy: false, isActive: true },
  { id: 42, code: "WG", name: "Women", genderId: 3, isOfficial: true, isLegacy: false, isActive: true },
  { id: 43, code: "MC", name: "Men Cadets", genderId: 2, maxAge: 16, isOfficial: true, isLegacy: false, isActive: true },
  { id: 44, code: "WC", name: "Women Cadets", genderId: 3, maxAge: 16, isOfficial: true, isLegacy: false, isActive: true },
  { id: 45, code: "XE", name: "Mixed Elite", genderId: 1, minAge: 23, isOfficial: true, isLegacy: false, isActive: true },
  { id: 46, code: "XJ", name: "Mixed Junior", genderId: 1, minAge: 17, maxAge: 18, isOfficial: true, isLegacy: false, isActive: true },
  { id: 47, code: "XU", name: "Mixed Under 23", genderId: 1, minAge: 19, maxAge: 22, isOfficial: true, isLegacy: false, isActive: true },
  { id: 48, code: "WY", name: "Women Youth", genderId: 3, isOfficial: true, isLegacy: false, isActive: true },
  { id: 49, code: "MO", name: "Men Open", genderId: 2, isOfficial: true, isLegacy: false, isActive: true },
  { id: 50, code: "XM", name: "Mixed Master", genderId: 1, isOfficial: true, isLegacy: false, isActive: true }
];

/**
 * Get category options for dropdown selection
 * @param genderId Optional filter by gender ID
 * @returns Array of category options
 */
export function getCategoryOptions(genderId?: number): CategoryOption[] {
  const filteredCategories = genderId
    ? categories.filter(category => category.isActive && category.genderId === genderId)
    : categories.filter(category => category.isActive);

  return [
    { label: 'All', value: null },
    ...filteredCategories.map(category => ({
      label: category.name,
      value: category.id
    }))
  ];
}

/**
 * Get a category by ID
 * @param id Category ID
 * @returns Category object or undefined if not found
 */
export function getCategoryById(id: number): Category | undefined {
  return categories.find(category => category.id === id);
}

/**
 * Get a category by code
 * @param code Category code
 * @returns Category object or undefined if not found
 */
export function getCategoryByCode(code: string): Category | undefined {
  return categories.find(category => category.code === code);
} 

/**
 * Get category options by IDs
 * @param ids Array of category IDs
 * @returns 
 */

export function getCategoryOptionsByIds(ids: number[]): CategoryOption[] {
  return categories
    .filter(category => ids.includes(category.id))
    .map(category => ({
      label: category.name,
      value: category.id
    }));
}