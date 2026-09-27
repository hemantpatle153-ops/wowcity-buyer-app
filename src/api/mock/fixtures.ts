/**
 * Demo data for mock mode (EXPO_PUBLIC_MOCK=1): shops in Bhopal (and one in
 * Indore) with clothing. Some items are sold out and some shops hide fields,
 * exactly as the real API would omit them.
 */

export type HideableField = 'name' | 'brand' | 'category' | 'size' | 'colour' | 'style' | 'mrp' | 'price';

export type FixtureStore = {
  storeId: string;
  name: string;
  city: string;
  state: string;
  /** Always known to the server (for distance); only shared when `sharesAddress`. */
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  sharesAddress: boolean;
  hidden: HideableField[];
};

export type FixtureVariant = {
  size?: string;
  colour?: string;
  style?: string;
  price: number;
  mrp?: number;
  inStock: boolean;
};

export type FixtureProduct = {
  productId: string;
  storeId: string;
  name: string;
  brand?: string;
  category: string;
  description?: string;
  photos: string[];
  variants: FixtureVariant[];
  tags?: string[];
  details?: { label: string; value: unknown }[];
  daysAgo: number;
};

export const MOCK_NOW = Date.parse('2026-09-26T10:00:00+05:30');

export const BHOPAL = { lat: 23.2599, lng: 77.4126, label: 'Bhopal' };

export function photo(id: string, width = 900): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=78&auto=format&fit=crop`;
}

const P = {
  poncho: '1434389677669-e08b4cac3105',
  blouseRack: '1490481651871-ab68de25d43d',
  graphicTeeMan: '1503341504253-dff4815485f1',
  yellowSet: '1515886657613-9f3515b0c78f',
  whiteTee: '1521572163474-6864f9cf17ab',
  sageTees: '1523381210434-271e8be1f52b',
  trench: '1539533018447-63fcce2678e3',
  patchJeans: '1541099649105-f69ad21f3246',
  darkJeans: '1542272604-787c3835535d',
  parka: '1548883354-94bcfe321cbb',
  leather: '1551028719-00167b16eac5',
  knitFlatlay: '1556905055-8f358a7a47b2',
  teeColours: '1562157873-818bc0726f68',
  dressRack: '1567401893414-76b7b1e5a7a5',
  redFlare: '1572804013309-59a88b7e92f1',
  catTee: '1576566588028-4147f3842f27',
  orangeSweat: '1578587018452-892bacefd3f2',
  lightJeans: '1582552938357-32b906df40cb',
  anarkaliWhite: '1583391733956-3750e0ff4e8b',
  skaterSkirt: '1583496661160-fb5886a0aaaa',
  sloganTee: '1583743814966-8936f5b7be1a',
  wineDress: '1585487000160-6ebcfceb0d03',
  bomber: '1591047139829-d91aecb6caea',
  blushJoggers: '1594633312681-425c7b97ccd1',
  redMaxi: '1595777457583-95e059d581b8',
  chambray: '1596755094514-f87e34085b2c',
  wideLeg: '1598554747436-c9293d6a588f',
  formalShirts: '1602810318383-e386cc2a3ccf',
  jeanStack: '1604176354204-9268737828e4',
  tealGown: '1609357605129-26f69add5d6e',
  saree: '1610030469983-98e550d6193c',
  redGown: '1612336307429-8a898d10e223',
  blazer: '1617137968427-85924c800a22',
  blackTee: '1618354691373-d851c5c3a990',
  whiteSweat: '1620799140408-edc6dcb6d633',
  lilacTee: '1622470953794-aa9c70b0fb9d',
  rawJeans: '1624378439575-d8705ad7ae80',
} as const;

export const fixtureStores: FixtureStore[] = [
  {
    storeId: 'st_kapdaghar',
    name: 'Kapda Ghar',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2332,
    lng: 77.4343,
    address: 'Shop 14, Zone-I, MP Nagar, Bhopal 462011',
    phone: '+919826012345',
    sharesAddress: true,
    hidden: [],
  },
  {
    storeId: 'st_raahi',
    name: 'Raahi Denim Co.',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2335,
    lng: 77.4005,
    address: '22 New Market, TT Nagar, Bhopal 462003',
    sharesAddress: true,
    hidden: ['mrp'],
  },
  {
    storeId: 'st_zari',
    name: 'Zari & Thread',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2645,
    lng: 77.402,
    address: '8 Chowk Bazaar, Old Bhopal 462001',
    phone: '+917554012233',
    sharesAddress: true,
    hidden: [],
  },
  {
    storeId: 'st_urbanloom',
    name: 'Urban Loom',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2156,
    lng: 77.4298,
    address: 'E-5 Arera Colony, Bhopal 462016',
    sharesAddress: false,
    hidden: ['brand', 'mrp'],
  },
  {
    storeId: 'st_stylestreet',
    name: 'Style Street',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2324,
    lng: 77.4298,
    address: 'Ground floor, DB City Mall, Arera Hills, Bhopal 462011',
    phone: '+919893098765',
    sharesAddress: true,
    hidden: ['price', 'mrp'],
  },
  {
    storeId: 'st_lakeview',
    name: 'Lakeview Fashion House',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2496,
    lng: 77.3947,
    address: '3 Shyamla Hills Road, Bhopal 462013',
    phone: '+919425011122',
    sharesAddress: true,
    hidden: ['style'],
  },
  {
    storeId: 'st_rajwada',
    name: 'Rajwada Trends',
    city: 'Indore',
    state: 'Madhya Pradesh',
    lat: 22.7186,
    lng: 75.8553,
    address: '41 Rajwada Chowk, Indore 452002',
    phone: '+917314055660',
    sharesAddress: true,
    hidden: [],
  },
];

const S = ['S', 'M', 'L', 'XL'];
function sized(
  sizes: string[],
  colour: string,
  price: number,
  mrp: number | undefined,
  soldOut: string[] = [],
  extra: Partial<FixtureVariant> = {},
): FixtureVariant[] {
  return sizes.map((size) => ({ size, colour, price, mrp, inStock: !soldOut.includes(size), ...extra }));
}

export const fixtureProducts: FixtureProduct[] = [
  // Kapda Ghar: everyday basics, shows every field
  {
    productId: 'p_kg_crewtee',
    storeId: 'st_kapdaghar',
    name: 'Essential cotton crew tee',
    brand: 'Kapda Basics',
    category: 'T-shirts',
    description:
      'A soft, breathable 180 GSM combed-cotton tee with a relaxed crew neck. The kind you reach for every morning.',
    photos: [photo(P.whiteTee), photo(P.teeColours)],
    variants: [
      ...sized(S, 'White', 399, 599),
      ...sized(['M', 'L'], 'Black', 399, 599, ['L']),
      ...sized(['S', 'M'], 'Navy', 449, 599),
    ],
    tags: ['basics', 'cotton', 'summer'],
    details: [
      { label: 'Fabric', value: '100% combed cotton' },
      { label: 'Fit', value: 'Regular' },
      { label: 'Care', value: 'Machine wash cold' },
    ],
    daysAgo: 0.2,
  },
  {
    productId: 'p_kg_sagetee',
    storeId: 'st_kapdaghar',
    name: 'Sage oversized tee',
    brand: 'Kapda Basics',
    category: 'T-shirts',
    description: 'Drop-shoulder oversized tee in a calm sage green. Garment-dyed for a lived-in feel.',
    photos: [photo(P.sageTees)],
    variants: sized(['M', 'L', 'XL'], 'Sage', 549, 799),
    tags: ['oversized', 'streetwear'],
    details: [{ label: 'Fit', value: 'Oversized' }],
    daysAgo: 1.5,
  },
  {
    productId: 'p_kg_chambray',
    storeId: 'st_kapdaghar',
    name: 'Polka-dot chambray shirt',
    brand: 'Indigo Lane',
    category: 'Shirts',
    description: 'Light chambray shirt with a tiny white dot print. Smart enough for work, easy for weekends.',
    photos: [photo(P.chambray)],
    variants: sized(['M', 'L', 'XL'], 'Blue', 1199, 1599, ['XL']),
    details: [
      { label: 'Fabric', value: 'Cotton chambray' },
      { label: 'Sleeve', value: 'Full' },
    ],
    daysAgo: 3,
  },
  {
    productId: 'p_kg_formal',
    storeId: 'st_kapdaghar',
    name: 'Formal cotton shirt',
    brand: 'Peter England',
    category: 'Shirts',
    description: 'Crisp, wrinkle-resistant office shirt with a spread collar.',
    photos: [photo(P.formalShirts)],
    variants: [
      ...sized(['38', '40', '42'], 'White', 1299, 1799),
      ...sized(['40', '42'], 'Maroon', 1399, 1799),
      ...sized(['40'], 'Grey', 1299, 1799),
    ],
    details: [{ label: 'Collar', value: 'Spread' }],
    daysAgo: 5,
  },
  {
    productId: 'p_kg_blazer',
    storeId: 'st_kapdaghar',
    name: 'Navy slim-fit blazer',
    brand: 'Raymond',
    category: 'Blazers',
    description: 'Two-button slim blazer in a fine wool blend. Pair with chinos for weddings and events.',
    photos: [photo(P.blazer)],
    variants: sized(['38', '40', '42'], 'Navy', 5499, 7999, ['38']),
    details: [
      { label: 'Fabric', value: 'Poly-wool blend' },
      { label: 'Lining', value: 'Full' },
    ],
    daysAgo: 8,
  },
  {
    productId: 'p_kg_lilac',
    storeId: 'st_kapdaghar',
    name: 'Lavender crew tee',
    brand: 'Kapda Basics',
    category: 'T-shirts',
    photos: [photo(P.lilacTee)],
    variants: sized(['M', 'L'], 'Lavender', 449, 599, ['M', 'L']),
    daysAgo: 12,
  },

  // Raahi Denim Co.: hides MRP, no phone
  {
    productId: 'p_rd_patch',
    storeId: 'st_raahi',
    name: 'Patchwork distressed mom jeans',
    brand: 'Raahi',
    category: 'Jeans',
    description: 'High-waisted mom jeans with hand-stitched patches and a cropped, tapered leg.',
    photos: [photo(P.patchJeans), photo(P.lightJeans)],
    variants: sized(['26', '28', '30', '32'], 'Mid blue', 1899, 2499, ['26']),
    details: [
      { label: 'Rise', value: 'High' },
      { label: 'Stretch', value: 'Slight' },
    ],
    daysAgo: 0.6,
  },
  {
    productId: 'p_rd_511',
    storeId: 'st_raahi',
    name: '511 slim dark wash jeans',
    brand: "Levi's",
    category: 'Jeans',
    description: 'The 511 slim: sits below the waist, slim through hip and thigh, with a narrow leg opening.',
    photos: [photo(P.darkJeans), photo(P.rawJeans)],
    variants: [
      { size: '30', colour: 'Dark indigo', price: 2999, mrp: 3999, inStock: true },
      { size: '32', colour: 'Dark indigo', price: 2999, mrp: 3999, inStock: true },
      { size: '34', colour: 'Dark indigo', price: 3199, mrp: 3999, inStock: true },
      { size: '36', colour: 'Dark indigo', price: 3199, mrp: 3999, inStock: false },
    ],
    details: [{ label: 'Fit', value: 'Slim' }],
    daysAgo: 2,
  },
  {
    productId: 'p_rd_light',
    storeId: 'st_raahi',
    name: 'Light wash straight jeans',
    brand: 'Raahi',
    category: 'Jeans',
    photos: [photo(P.lightJeans)],
    variants: sized(['30', '32', '34'], 'Light blue', 1699, 2199),
    daysAgo: 4,
  },
  {
    productId: 'p_rd_wide',
    storeId: 'st_raahi',
    name: 'High-rise wide-leg jeans',
    brand: 'Raahi',
    category: 'Jeans',
    description: 'Fluid wide legs and a flattering high rise, finished with a clean hem.',
    photos: [photo(P.wideLeg)],
    variants: sized(['26', '28', '30'], 'Mid blue', 2199, 2799),
    daysAgo: 6,
  },
  {
    productId: 'p_rd_stack',
    storeId: 'st_raahi',
    name: 'Classic straight jeans',
    brand: 'Raahi',
    category: 'Jeans',
    photos: [photo(P.jeanStack)],
    variants: sized(['30', '32', '34'], 'Indigo', 1499, 1999, ['30', '32', '34']),
    daysAgo: 9,
  },
  {
    productId: 'p_rd_raw',
    storeId: 'st_raahi',
    name: 'Raw indigo bootcut jeans',
    brand: 'Wrangler',
    category: 'Jeans',
    photos: [photo(P.rawJeans)],
    variants: sized(['32', '34'], 'Raw indigo', 2499, 3299),
    daysAgo: 15,
  },

  // Zari & Thread: ethnic wear with custom detail fields
  {
    productId: 'p_zt_anarkali',
    storeId: 'st_zari',
    name: 'Ivory chikankari anarkali',
    brand: 'Zari & Thread',
    category: 'Ethnic wear',
    description:
      'Hand-embroidered Lucknowi chikankari on soft georgette, with a flared anarkali silhouette and matching dupatta.',
    photos: [photo(P.anarkaliWhite), photo(P.tealGown)],
    variants: sized(S, 'Ivory', 4499, 5999, ['S']),
    tags: ['festive', 'wedding', 'chikankari'],
    details: [
      { label: 'Fabric', value: 'Georgette' },
      { label: 'Work', value: 'Hand chikankari' },
      { label: 'Occasion', value: 'Festive, wedding' },
      { label: 'Includes', value: 'Kurta, dupatta' },
    ],
    daysAgo: 0.1,
  },
  {
    productId: 'p_zt_saree',
    storeId: 'st_zari',
    name: 'Banarasi silk saree',
    brand: 'Zari & Thread',
    category: 'Sarees',
    description: 'Deep purple Banarasi silk with a rich gold zari border and pallu. Comes with an unstitched blouse piece.',
    photos: [photo(P.saree)],
    variants: [{ colour: 'Purple & gold', style: 'Banarasi', price: 8999, mrp: 11999, inStock: true }],
    tags: ['silk', 'wedding', 'banarasi'],
    details: [
      { label: 'Fabric', value: 'Pure silk' },
      { label: 'Length', value: '6.3 m with blouse piece' },
      { label: 'Silk Mark', value: true },
    ],
    daysAgo: 1,
  },
  {
    productId: 'p_zt_teal',
    storeId: 'st_zari',
    name: 'Teal georgette anarkali',
    brand: 'Zari & Thread',
    category: 'Ethnic wear',
    description: 'A flowing floor-length anarkali with sheer sleeves and a tiered hem.',
    photos: [photo(P.tealGown)],
    variants: sized(['M', 'L'], 'Teal', 3799, 4999),
    details: [{ label: 'Fabric', value: 'Georgette' }],
    daysAgo: 7,
  },
  {
    productId: 'p_zt_maxi',
    storeId: 'st_zari',
    name: 'Scarlet flowy maxi gown',
    brand: 'Zari & Thread',
    category: 'Dresses',
    photos: [photo(P.redMaxi)],
    variants: sized(['S', 'M'], 'Scarlet', 3299, 4299, ['S', 'M']),
    details: [{ label: 'Occasion', value: 'Sangeet, party' }],
    daysAgo: 11,
  },

  // Urban Loom: hides brand and MRP, address not shared
  {
    productId: 'p_ul_set',
    storeId: 'st_urbanloom',
    name: 'Mustard hoodie & jogger set',
    brand: 'Urban Loom',
    category: 'Activewear',
    description: 'Cropped hoodie with matching joggers in brushed fleece. Cosy, bright and easy to style.',
    photos: [photo(P.yellowSet)],
    variants: sized(['S', 'M', 'L'], 'Mustard', 2299, 2999),
    details: [{ label: 'Fabric', value: 'Brushed fleece' }],
    daysAgo: 0.4,
  },
  {
    productId: 'p_ul_parka',
    storeId: 'st_urbanloom',
    name: 'Olive utility parka',
    brand: 'Urban Loom',
    category: 'Jackets',
    description: 'Water-resistant parka with a hood, four cargo pockets and a drawcord waist.',
    photos: [photo(P.parka)],
    variants: sized(['M', 'L', 'XL'], 'Olive', 3499, 4499, ['XL']),
    details: [{ label: 'Water resistant', value: true }],
    daysAgo: 2.5,
  },
  {
    productId: 'p_ul_sweat',
    storeId: 'st_urbanloom',
    name: 'Tangerine crewneck sweatshirt',
    category: 'Sweatshirts',
    photos: [photo(P.orangeSweat)],
    variants: sized(['S', 'M', 'L'], 'Orange', 1299, 1799),
    daysAgo: 3.5,
  },
  {
    productId: 'p_ul_bomber',
    storeId: 'st_urbanloom',
    name: 'Rust satin bomber jacket',
    category: 'Jackets',
    photos: [photo(P.bomber)],
    variants: sized(['M', 'L'], 'Rust', 2799, 3499),
    daysAgo: 6.5,
  },
  {
    productId: 'p_ul_joggers',
    storeId: 'st_urbanloom',
    name: 'Blush cargo joggers',
    category: 'Trousers',
    photos: [photo(P.blushJoggers)],
    variants: sized(['S', 'M', 'L'], 'Blush pink', 1599, 1999, ['L']),
    daysAgo: 10,
  },
  {
    productId: 'p_ul_whitesweat',
    storeId: 'st_urbanloom',
    name: 'Cloud white sweatshirt',
    category: 'Sweatshirts',
    photos: [photo(P.whiteSweat)],
    variants: sized(['M', 'L', 'XL'], 'White', 1199, 1499, ['M', 'L', 'XL']),
    daysAgo: 13,
  },

  // Style Street: hides price and MRP (buyers ask in the shop)
  {
    productId: 'p_ss_skeleton',
    storeId: 'st_stylestreet',
    name: 'Skeleton peace graphic tee',
    brand: 'Bewakoof',
    category: 'T-shirts',
    photos: [photo(P.graphicTeeMan)],
    variants: sized(['M', 'L', 'XL'], 'Black', 699, 999),
    daysAgo: 0.8,
  },
  {
    productId: 'p_ss_leather',
    storeId: 'st_stylestreet',
    name: 'Biker leather jacket',
    brand: 'Roadster',
    category: 'Jackets',
    description: 'Classic asymmetric biker in soft faux leather with silver hardware.',
    photos: [photo(P.leather)],
    variants: sized(['M', 'L'], 'Black', 3999, 5499, ['M', 'L']),
    details: [{ label: 'Material', value: 'Faux leather' }],
    daysAgo: 4.5,
  },
  {
    productId: 'p_ss_cat',
    storeId: 'st_stylestreet',
    name: 'Lucky cat graphic tee',
    brand: 'Bewakoof',
    category: 'T-shirts',
    photos: [photo(P.catTee)],
    variants: sized(['S', 'M', 'L'], 'Beige', 599, 899),
    daysAgo: 5.5,
  },
  {
    productId: 'p_ss_slogan',
    storeId: 'st_stylestreet',
    name: 'Monochrome slogan tee',
    brand: 'Roadster',
    category: 'T-shirts',
    photos: [photo(P.sloganTee), photo(P.blackTee)],
    variants: sized(['M', 'L'], 'Black', 649, 899),
    daysAgo: 8.5,
  },
  {
    productId: 'p_ss_logo',
    storeId: 'st_stylestreet',
    name: 'Black logo tee',
    brand: 'Roadster',
    category: 'T-shirts',
    photos: [photo(P.blackTee)],
    variants: sized(['S', 'M', 'L', 'XL'], 'Black', 549, 799),
    daysAgo: 14,
  },

  // Lakeview Fashion House: women's wear
  {
    productId: 'p_lv_flare',
    storeId: 'st_lakeview',
    name: 'Red polka flare dress',
    brand: 'Lakeview',
    category: 'Dresses',
    description: 'A fit-and-flare midi with a cinched waist, cap sleeves and a playful polka print.',
    photos: [photo(P.redFlare)],
    variants: sized(['S', 'M', 'L'], 'Red', 1899, 2599),
    details: [
      { label: 'Length', value: 'Midi' },
      { label: 'Fabric', value: 'Crepe' },
    ],
    daysAgo: 0.3,
  },
  {
    productId: 'p_lv_poncho',
    storeId: 'st_lakeview',
    name: 'Crochet fringe poncho',
    brand: 'Lakeview',
    category: 'Tops',
    description: 'Hand-crocheted cream poncho with a fringed hem. Layers beautifully over dresses.',
    photos: [photo(P.poncho)],
    variants: [{ size: 'Free size', colour: 'Cream', price: 1299, mrp: 1699, inStock: true }],
    details: [{ label: 'Handmade', value: true }],
    daysAgo: 1.2,
  },
  {
    productId: 'p_lv_trench',
    storeId: 'st_lakeview',
    name: 'Belted camel trench coat',
    brand: 'Vero Moda',
    category: 'Jackets',
    description: 'Double-breasted trench with a tie belt and storm flap.',
    photos: [photo(P.trench)],
    variants: sized(['S', 'M'], 'Camel', 4999, 6999, ['S', 'M']),
    daysAgo: 2.2,
  },
  {
    productId: 'p_lv_skirt',
    storeId: 'st_lakeview',
    name: 'Pleated black skater skirt',
    brand: 'Only',
    category: 'Skirts',
    photos: [photo(P.skaterSkirt)],
    variants: sized(['S', 'M', 'L'], 'Black', 1099, 1499),
    daysAgo: 4.8,
  },
  {
    productId: 'p_lv_wine',
    storeId: 'st_lakeview',
    name: 'Wine corduroy shirt dress',
    brand: 'Lakeview',
    category: 'Dresses',
    photos: [photo(P.wineDress)],
    variants: sized(['S', 'M', 'L'], 'Wine', 2199, 2799, ['L']),
    daysAgo: 7.5,
  },
  {
    productId: 'p_lv_gown',
    storeId: 'st_lakeview',
    name: 'Red one-shoulder gown',
    brand: 'Lakeview',
    category: 'Dresses',
    photos: [photo(P.redGown)],
    variants: sized(['S', 'M'], 'Red', 5999, 7499),
    daysAgo: 9.5,
  },
  {
    productId: 'p_lv_knit',
    storeId: 'st_lakeview',
    name: 'Cosy knit & beanie set',
    brand: 'Lakeview',
    category: 'Sweaters',
    photos: [photo(P.knitFlatlay)],
    variants: sized(['M', 'L'], 'Grey', 1799, 2299),
    daysAgo: 16,
  },

  // Rajwada Trends (Indore): shows the city fallback
  {
    productId: 'p_rj_blouse',
    storeId: 'st_rajwada',
    name: 'Summer blouse edit',
    brand: 'Rajwada',
    category: 'Tops',
    photos: [photo(P.blouseRack)],
    variants: sized(['S', 'M', 'L'], 'White', 899, 1199),
    daysAgo: 2,
  },
  {
    productId: 'p_rj_dresses',
    storeId: 'st_rajwada',
    name: 'Printed day dress',
    brand: 'Rajwada',
    category: 'Dresses',
    photos: [photo(P.dressRack)],
    variants: sized(['S', 'M'], 'Multicolour', 1399, 1799),
    daysAgo: 3,
  },
];
