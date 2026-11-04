/**
 * Food Service interacting with Open Food Facts API
 * Provides live barcode search, food text search, and offline fallback catalog.
 */

const OFF_BASE_URL = 'https://world.openfoodfacts.org';

// Fallback curated database for offline/quick testing
export const COMMON_FOOD_SUGGESTIONS = [
  {
    name: 'Oatmeal (Rolled Oats)',
    brand: 'FitTrack Nutrition',
    barcode: '0030000010101',
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    servingSize: '100g',
    image: 'https://images.unsplash.com/photo-1584985449747-d1e9960ff292?w=300&q=80'
  },
  {
    name: 'Skinless Chicken Breast',
    brand: 'Fresh Meat',
    barcode: '0020000020202',
    calories: 165,
    protein: 31.0,
    carbs: 0.0,
    fat: 3.6,
    servingSize: '100g',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80'
  },
  {
    name: 'Greek Yogurt Plain 0%',
    brand: 'Greek Dairy',
    barcode: '0052000030303',
    calories: 59,
    protein: 10.3,
    carbs: 3.6,
    fat: 0.4,
    servingSize: '100g',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80'
  },
  {
    name: 'Brown Basmati Rice (Cooked)',
    brand: 'Whole Grains',
    barcode: '0075000040404',
    calories: 123,
    protein: 2.7,
    carbs: 25.6,
    fat: 1.0,
    servingSize: '100g',
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300&q=80'
  },
  {
    name: 'Fresh Hass Avocado',
    brand: 'Nature Fresh',
    barcode: '0098000050505',
    calories: 160,
    protein: 2.0,
    carbs: 8.5,
    fat: 14.7,
    servingSize: '100g',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&q=80'
  },
  {
    name: 'Large Whole Egg',
    brand: 'Free Range',
    barcode: '0011000060606',
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    servingSize: '100g (approx 2 eggs)',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&q=80'
  },
  {
    name: 'Whey Protein Isolate (Vanilla)',
    brand: 'Optimum Fitness',
    barcode: '00748927022049',
    calories: 375,
    protein: 80.0,
    carbs: 6.0,
    fat: 2.5,
    servingSize: '100g (30g per scoop: 112 kcal, 24g P)',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&q=80'
  },
  {
    name: 'Raw Almonds',
    brand: 'NutriNuts',
    barcode: '0041000080808',
    calories: 579,
    protein: 21.2,
    carbs: 21.6,
    fat: 49.9,
    servingSize: '100g',
    image: 'https://images.unsplash.com/photo-1508061252224-b045430b310a?w=300&q=80'
  }
];

/**
 * Normalize Open Food Facts product structure
 */
function normalizeProduct(product, rawBarcode = '') {
  if (!product) return null;
  const nutriments = product.nutriments || {};

  // Extract calories: energy-kcal_100g or energy_100g / 4.184
  let calories = Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0);
  if (!calories && nutriments['energy_100g']) {
    calories = Math.round(nutriments['energy_100g'] / 4.184);
  }

  const protein = parseFloat(Number(nutriments['proteins_100g'] || nutriments['proteins'] || 0).toFixed(1));
  const carbs = parseFloat(Number(nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0).toFixed(1));
  const fat = parseFloat(Number(nutriments['fat_100g'] || nutriments['fat'] || 0).toFixed(1));

  return {
    name: product.product_name || product.generic_name || 'Unnamed Food Product',
    brand: product.brands || 'Generic / Unspecified',
    barcode: product.code || rawBarcode,
    image: product.image_url || product.image_front_url || product.image_small_url || null,
    servingSize: product.serving_size || '100g',
    calories,
    protein,
    carbs,
    fat,
    nutriscore: product.nutriscore_grade ? product.nutriscore_grade.toUpperCase() : null,
    categories: product.categories || 'Food'
  };
}

/**
 * Fetch product details by barcode from Open Food Facts API
 */
export async function fetchProductByBarcode(barcode) {
  const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
  if (!cleanBarcode) {
    throw new Error('Please enter a valid numeric barcode.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${OFF_BASE_URL}/api/v0/product/${cleanBarcode}.json`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open Food Facts API error (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (data.status === 1 && data.product) {
      return normalizeProduct(data.product, cleanBarcode);
    }

    // Check if barcode matches any in fallback suggestions
    const localMatch = COMMON_FOOD_SUGGESTIONS.find((f) => f.barcode === cleanBarcode);
    if (localMatch) {
      return localMatch;
    }

    throw new Error(`No product found with barcode "${cleanBarcode}" in Open Food Facts database.`);
  } catch (err) {
    // Check fallback if network fails
    const localMatch = COMMON_FOOD_SUGGESTIONS.find((f) => f.barcode === cleanBarcode);
    if (localMatch) {
      return localMatch;
    }

    if (err.name === 'AbortError') {
      throw new Error('Open Food Facts API request timed out. Please check your internet connection or enter manually.');
    }
    throw err;
  }
}

/**
 * Search food products by keyword query
 */
export async function searchFoodByName(query) {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const url = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=15`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Search request failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (data.products && Array.isArray(data.products)) {
      const results = data.products
        .filter((p) => p.product_name)
        .map((p) => normalizeProduct(p));

      if (results.length > 0) {
        return results;
      }
    }

    // Local fallback search
    return COMMON_FOOD_SUGGESTIONS.filter(
      (f) =>
        f.name.toLowerCase().includes(cleanQuery) ||
        f.brand.toLowerCase().includes(cleanQuery)
    );
  } catch (err) {
    console.warn('OFF API search failed, returning local catalog:', err.message);
    return COMMON_FOOD_SUGGESTIONS.filter(
      (f) =>
        f.name.toLowerCase().includes(cleanQuery) ||
        f.brand.toLowerCase().includes(cleanQuery)
    );
  }
}
