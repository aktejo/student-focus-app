// List of 365 curated high-quality nature landscape photo IDs from Unsplash.
// Cycling through 50 highly atmospheric nature images to fill 365 unique days.
const BASE_LANDSCAPE_IDS = [
  'photo-1469474968028-56623f02e42e', // Misty forest/mountain
  'photo-1470071459604-3b5ec3a7fe05', // Misty hills
  'photo-1501785888041-af3ef285b470', // Alpine lake
  'photo-1447752875215-b2761acb3c5d', // Forest path
  'photo-1441974231531-c6227db76b6e', // Sunlight in forest
  'photo-1472214222541-d510753a4907', // Sunset landscape
  'photo-1506744038136-46273834b3fb', // Yosemite valley
  'photo-1513836279014-a89f7a76ae86', // Snowy trees
  'photo-1464822759023-fed622ff2c3b', // Mountains
  'photo-1500530855697-b586d89ba3ee', // Desert hills
  'photo-1470240731273-7821a6eeb6bd', // Spring flowers
  'photo-1507525428034-b723cf961d3e', // Beach sunset
  'photo-1433832597046-4f10e10ac764', // Hot air balloons over landscape
  'photo-1518495973542-4542c06a5843', // Sun rays through trees
  'photo-1426604966848-d7adac402bff', // Misty mountains
  'photo-1475924156734-496f6cac6ec1', // Ocean sunrise
  'photo-1461896836934-ffe607ba8211', // Running road
  'photo-1502082553048-f009c37129b9', // Wood rings
  'photo-1505761671935-60b3a7427bad', // Stonehenge sunset
  'photo-1486915309851-b0cc1f8a0084', // Night sky campfire
  'photo-1510784722466-f2aa9c52ffe6', // Coastal sunset
  'photo-1508739773434-c26b3d09e071', // Forest pathway
  'photo-1473448912268-2022ce9509d8', // Autumn forest
  'photo-1504280390367-361c6d9f38f4', // Night forest camping
  'photo-1511497584788-876760111969', // Pine forest
  'photo-1502086223501-7ea6ecd79368', // Snowy mountain peak
  'photo-1519681393784-d120267933ba', // Starry mountain night
  'photo-1501854140801-50d01698950b', // Green valley landscape
  'photo-1476514525535-07fb3b4ae5f1', // Lake mountain sunset
  'photo-1434725039720-abb26e22ebe8', // Green field sunset
  'photo-1497436072909-60f360e1d4b1', // Mountain lake reflection
  'photo-1509023464722-18d996393ca8', // Foggy road
  'photo-1475113548554-5a36f1f523d6', // Birds over lake
  'photo-1533473359331-0135ef1b58bf', // Mountain pass
  'photo-1518098268026-4e43a1a009de', // Desert sunset
  'photo-1528164344705-47542687000d', // Japanese temple landscape
  'photo-1532274402911-5a369e4c4bb5', // Mountain and lake
  'photo-1534447677768-be436bb09401', // Northern lights aurora
  'photo-1506260408121-e35fcaf80b87', // Green mountain canyon
  'photo-1504893524553-ac55fce69cbf', // Misty mountains
  'photo-1508515053941-796e246e27ab', // Wave ocean coastline
  'photo-1536240478700-b869070f9279', // Island beach palm
  'photo-1547036967-23d11aacaee0', // Snowy mountain cabin
  'photo-1478131143081-d6141847b4cd', // Grand canyon
  'photo-1516026672322-bc52d61a55d5', // Desert dunes sunset
  'photo-1520201163981-8cc95007dd2a', // Tuscan rolling hills
  'photo-1538964173425-93884d739596', // Coastline beach ocean
  'photo-1500627869374-13cd993b1115', // Misty green hills
  'photo-1509316975850-ff9c5deb0cd9', // Icelandic landscape
  'photo-1507200171048-224155b76392', // Forest waterfall
];

// Generate an array of exactly 365 high-quality landscape URLs
export const LANDSCAPE_URLS_365: string[] = Array.from({ length: 365 }, (_, index) => {
  const photoId = BASE_LANDSCAPE_IDS[index % BASE_LANDSCAPE_IDS.length];
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1920&q=80`;
});

// Helper to get the background URL for the current day of the year
export const getLandscapeForDate = (date: Date): string => {
  // Compute day of the year (0 to 364)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.max(0, Math.min(364, dayOfYear));
  return LANDSCAPE_URLS_365[index];
};
