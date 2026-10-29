import type { Product } from '../types';

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=82`;

const keywordImages: Array<[RegExp, string]> = [
  [/apple/i, unsplash('photo-1560806887-1e4cd0b6cbd6')],
  [/banana|kola/i, unsplash('photo-1571771894821-ce9b6c11b08e')],
  [/orange|malta|lemon/i, unsplash('photo-1547514701-42782101795e')],
  [/grape/i, unsplash('photo-1537640538966-79f369143f8f')],
  [/papaya/i, unsplash('photo-1517282009859-f000ec3b26fe')],
  [/tomato/i, unsplash('photo-1546094096-0df4bcaaa337')],
  [/potato/i, unsplash('photo-1518977676601-b53f82aba655')],
  [/onion|garlic|ginger/i, unsplash('photo-1618512496248-a07fe83aa8cb')],
  [/egg/i, unsplash('photo-1506976785307-8732e854ad03')],
  [/milk|dairy|yogurt/i, unsplash('photo-1550583724-b2692b85b150')],
  [/bread|bakery|biscuit|cookie/i, unsplash('photo-1509440159596-0249088772ff')],
  [/coffee|tea/i, unsplash('photo-1447933601403-0c6688de566e')],
  [/chocolate|candy/i, unsplash('photo-1575377427642-087cf684f29d')],
  [/ice cream|dessert/i, unsplash('photo-1563805042-7684c019e1cb')],
  [/fish|hilsa|seafood/i, unsplash('photo-1544551763-46a013bb70d5')],
  [/chicken|beef|mutton|meat/i, unsplash('photo-1607623814075-e51df1bdc82f')],
  [/rice|grain|flour|atta|maida/i, unsplash('photo-1586201375761-83865001e31c')],
  [/oil|ghee/i, unsplash('photo-1474979266404-7eaacbcd87c5')],
  [/spice|seasoning|salt/i, unsplash('photo-1596040033229-a9821ebd058d')],
  [/juice|beverage|drink|water/i, unsplash('photo-1544145945-f90425340c7e')],
  [/snack|chips/i, unsplash('photo-1621939514649-280e2aa9454f')],
];

const categoryImages: Array<[RegExp, string]> = [
  [/fruit|produce/i, unsplash('photo-1610832958506-aa56368176cf')],
  [/vegetable/i, unsplash('photo-1540420773420-3366772f4999')],
  [/meat|poultry/i, unsplash('photo-1607623814075-e51df1bdc82f')],
  [/fish|seafood/i, unsplash('photo-1544551763-46a013bb70d5')],
  [/dairy|egg|chilled/i, unsplash('photo-1628088062854-d1870b4553da')],
  [/bakery|breakfast/i, unsplash('photo-1509440159596-0249088772ff')],
  [/beverage|cold drink/i, unsplash('photo-1544145945-f90425340c7e')],
  [/tea|coffee/i, unsplash('photo-1495474472287-4d71bcdd2085')],
  [/dessert|ice cream/i, unsplash('photo-1563805042-7684c019e1cb')],
  [/chocolate|candy/i, unsplash('photo-1575377427642-087cf684f29d')],
  [/snack|biscuit/i, unsplash('photo-1621939514649-280e2aa9454f')],
  [/frozen|ready meal|noodle|pasta|soup/i, unsplash('photo-1563379926898-05f4575a45d8')],
  [/rice|flour|grain|daily essential/i, unsplash('photo-1586201375761-83865001e31c')],
  [/oil|ghee|spice|seasoning|sauce|pickle|spread/i, unsplash('photo-1596040033229-a9821ebd058d')],
  [/cleaning|laundry/i, unsplash('photo-1583947215259-38e31be8751f')],
  [/household/i, unsplash('photo-1527515637462-cff94eecc1ac')],
  [/personal care|bath|oral|grooming|beauty/i, unsplash('photo-1556228578-8c89e6adf883')],
  [/health|wellness/i, unsplash('photo-1505751172876-fa1923c5c528')],
  [/baby|diaper/i, unsplash('photo-1515488042361-ee00e0ddd4e4')],
  [/pet/i, unsplash('photo-1589924691995-400dc9ecc119')],
  [/stationery|batter/i, unsplash('photo-1455390582262-044cdead277a')],
];

export const getProductImage = (product: Product): string => {
  if (product.image_url?.trim()) return product.image_url;

  const productText = `${product.name_en} ${product.brand || ''}`;
  const keywordMatch = keywordImages.find(([pattern]) => pattern.test(productText));
  if (keywordMatch) return keywordMatch[1];

  const categoryText = `${product.category_name || ''} ${product.department || ''}`;
  const categoryMatch = categoryImages.find(([pattern]) => pattern.test(categoryText));
  return categoryMatch?.[1] || unsplash('photo-1542838132-92c53300491e');
};

export const getProductFallback = (product: Product): string => {
  const text = `${product.name_en} ${product.category_name || ''} ${product.department || ''}`.toLowerCase();
  const emoji =
    /fruit|apple|banana|orange|grape|papaya/.test(text) ? '🍎' :
    /vegetable|tomato|potato|onion|garlic|ginger/.test(text) ? '🥬' :
    /meat|beef|mutton/.test(text) ? '🥩' :
    /chicken|poultry/.test(text) ? '🍗' :
    /fish|seafood|hilsa/.test(text) ? '🐟' :
    /milk|dairy/.test(text) ? '🥛' :
    /egg/.test(text) ? '🥚' :
    /bread|bakery|biscuit/.test(text) ? '🥖' :
    /coffee|tea/.test(text) ? '☕' :
    /drink|beverage|juice|water/.test(text) ? '🧃' :
    /ice cream|dessert/.test(text) ? '🍨' :
    /chocolate|candy/.test(text) ? '🍫' :
    /rice|grain|flour|atta/.test(text) ? '🌾' :
    /cleaning|laundry/.test(text) ? '🧼' :
    /personal|bath|oral|grooming/.test(text) ? '🧴' :
    /baby|diaper/.test(text) ? '🍼' :
    /pet/.test(text) ? '🐾' : '🛍️';

  const label = product.brand || product.category_name || 'NovaMart';
  const safeLabel = label.replace(/[&<>"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7fa"/><stop offset="1" stop-color="#fce0eb"/></linearGradient></defs><rect width="640" height="480" rx="32" fill="url(#g)"/><circle cx="320" cy="210" r="126" fill="#fff" opacity=".86"/><text x="320" y="254" text-anchor="middle" font-size="120">${emoji}</text><text x="320" y="405" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#a11350">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

