/**
 * AI Food Recognition Service using Google Gemini Vision API (Frontend-only)
 *
 * NOTE: Because this is a frontend-only React + Vite application, VITE_GEMINI_API_KEY
 * is bundled into client-side code and exposed in browser network requests.
 * Restrict your API key in Google Cloud / Google AI Studio (HTTP referrer & quota limits)
 * before deploying to production.
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function isGeminiConfigured() {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

/**
 * Convert a File or Blob into { base64, mimeType }
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image file provided.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.includes(',')) {
        reject(new Error('Failed to read image data.'));
        return;
      }
      const [header, base64] = result.split(',');
      const mimeMatch = header.match(/data:(.*?);base64/);
      const mimeType = mimeMatch?.[1] || file.type || 'image/jpeg';
      resolve({ base64, mimeType, dataUrl: result });
    };
    reader.onerror = () => reject(new Error('Unable to read the selected image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract { base64, mimeType } from a data URL (e.g. canvas.toDataURL('image/jpeg'))
 */
export function dataUrlToBase64(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
    throw new Error('Invalid image data URL.');
  }
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  return { base64, mimeType };
}

const FOOD_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isFood: {
      type: 'BOOLEAN',
      description: 'True if the image contains recognizable food or beverages, false otherwise.'
    },
    mealName: {
      type: 'STRING',
      description: 'Short, descriptive name for the overall meal or dish.'
    },
    notes: {
      type: 'STRING',
      description: 'Brief note about estimation assumptions (e.g., visible oil, sauce, cooking method).'
    },
    items: {
      type: 'ARRAY',
      description: 'Individual food items identified in the image.',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          portionDescription: { type: 'STRING' },
          portionGrams: { type: 'NUMBER' },
          calories: { type: 'NUMBER' },
          protein: { type: 'NUMBER' },
          carbs: { type: 'NUMBER' },
          fat: { type: 'NUMBER' },
          fiber: { type: 'NUMBER' },
          sugar: { type: 'NUMBER' }
        },
        required: [
          'name',
          'portionDescription',
          'portionGrams',
          'calories',
          'protein',
          'carbs',
          'fat',
          'fiber',
          'sugar'
        ]
      }
    }
  },
  required: ['isFood', 'mealName', 'items']
};

/**
 * Analyze a food image via Google Gemini Vision API
 * @param {{ base64: string, mimeType: string }} imageInput
 * @returns {Promise<{ mealName: string, notes: string, items: Array }>}
 */
export async function analyzeFoodImage({ base64, mimeType }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add VITE_GEMINI_API_KEY to your .env file and restart Vite.'
    );
  }

  if (!base64 || !mimeType) {
    throw new Error('A valid food image is required for analysis.');
  }

  const prompt = [
    'You are a nutrition analysis assistant.',
    'Inspect the provided photo and identify every distinct food or beverage item visible.',
    'For each item, estimate a realistic portion description (e.g. "150g", "1 cup (240g)", "2 slices (60g)"),',
    'the estimated weight in grams (portionGrams), and nutritional values for that portion:',
    'calories (kcal), protein (g), carbs (g), fat (g), fiber (g), and sugar (g).',
    'If the image does not show food or drink, set isFood to false and return an empty items array.',
    'Respond strictly with JSON matching the schema.'
  ].join(' ');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const endpoint = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: FOOD_RESPONSE_SCHEMA
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let apiMsg = `Gemini API error (HTTP ${response.status})`;
      try {
        const errBody = await response.json();
        if (errBody?.error?.message) {
          apiMsg = errBody.error.message;
        }
      } catch {
        // ignore JSON parse error on error response
      }

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw new Error(`API authentication or request error: ${apiMsg}`);
      }
      if (response.status === 429) {
        throw new Error('Gemini API rate limit reached. Please wait a moment and try again.');
      }
      throw new Error(apiMsg);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      throw new Error(
        finishReason
          ? `Gemini could not complete analysis (${finishReason}). Try a clearer photo.`
          : 'Gemini returned an empty response. Please try again.'
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse nutrition data returned by Gemini.');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (parsed.isFood === false || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      throw new Error(
        'No food items were detected in this image. Please capture or upload a clear photo of your meal.'
      );
    }

    const items = parsed.items.map((item, idx) => {
      const portionGrams = Math.max(1, Math.round(Number(item.portionGrams) || 100));
      const calories = Math.max(0, Math.round(Number(item.calories) || 0));
      const protein = Math.max(0, parseFloat((Number(item.protein) || 0).toFixed(1)));
      const carbs = Math.max(0, parseFloat((Number(item.carbs) || 0).toFixed(1)));
      const fat = Math.max(0, parseFloat((Number(item.fat) || 0).toFixed(1)));
      const fiber = Math.max(0, parseFloat((Number(item.fiber) || 0).toFixed(1)));
      const sugar = Math.max(0, parseFloat((Number(item.sugar) || 0).toFixed(1)));

      return {
        id: `ai-item-${Date.now()}-${idx}`,
        name: String(item.name || `Food Item ${idx + 1}`).trim(),
        portion: String(item.portionDescription || `${portionGrams}g`).trim(),
        portionGrams,
        baseGrams: portionGrams,
        baseCalories: calories,
        baseProtein: protein,
        baseCarbs: carbs,
        baseFat: fat,
        baseFiber: fiber,
        baseSugar: sugar,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar
      };
    });

    return {
      mealName: String(parsed.mealName || items.map((i) => i.name).join(', ')).trim(),
      notes: parsed.notes ? String(parsed.notes).trim() : '',
      items
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Food analysis timed out. Please check your connection and try again.');
    }
    throw err;
  }
}
