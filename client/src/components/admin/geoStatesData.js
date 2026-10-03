// State & Provincial Boundary Vectors Dataset
// Renders realistic regional subdivision paths for deep zoom into states and provinces

export const STATE_BOUNDARIES = [
  // --- United States State Line Segments ---
  // West Coast (Washington / Oregon / California)
  {
    name: 'Washington - Oregon Border',
    country: 'USA',
    coords: [[-124.0, 46.25], [-122.5, 45.6], [-119.0, 45.9], [-116.9, 46.0]]
  },
  {
    name: 'California - Oregon Border',
    country: 'USA',
    coords: [[-124.2, 42.0], [-120.0, 42.0]]
  },
  {
    name: 'California - Nevada Border',
    country: 'USA',
    coords: [[-120.0, 42.0], [-120.0, 39.0], [-114.6, 35.0]]
  },
  {
    name: 'California - Arizona Border',
    country: 'USA',
    coords: [[-114.6, 35.0], [-114.5, 34.2], [-114.7, 32.7]]
  },
  // Texas Borders
  {
    name: 'Texas - New Mexico Border',
    country: 'USA',
    coords: [[-103.0, 36.5], [-103.0, 32.0], [-106.5, 32.0]]
  },
  {
    name: 'Texas - Oklahoma Border',
    country: 'USA',
    coords: [[-103.0, 36.5], [-100.0, 36.5], [-100.0, 34.5], [-94.5, 33.6]]
  },
  {
    name: 'Texas - Louisiana Border',
    country: 'USA',
    coords: [[-94.0, 33.0], [-93.8, 31.0], [-93.9, 29.7]]
  },
  // East Coast / Midwest
  {
    name: 'New York - Pennsylvania Border',
    country: 'USA',
    coords: [[-79.7, 42.0], [-75.3, 42.0], [-74.7, 41.3]]
  },
  {
    name: 'Florida - Georgia Border',
    country: 'USA',
    coords: [[-85.0, 31.0], [-82.2, 30.6], [-81.4, 30.7]]
  },
  {
    name: 'Illinois - Indiana Border',
    country: 'USA',
    coords: [[-87.5, 41.7], [-87.5, 39.4], [-87.5, 37.9]]
  },

  // --- Canadian Provincial Borders ---
  {
    name: 'British Columbia - Alberta Border',
    country: 'Canada',
    coords: [[-120.0, 60.0], [-120.0, 53.7], [-115.0, 49.0]]
  },
  {
    name: 'Alberta - Saskatchewan Border',
    country: 'Canada',
    coords: [[-110.0, 60.0], [-110.0, 49.0]]
  },
  {
    name: 'Saskatchewan - Manitoba Border',
    country: 'Canada',
    coords: [[-102.0, 60.0], [-102.0, 49.0]]
  },
  {
    name: 'Ontario - Quebec Border',
    country: 'Canada',
    coords: [[-79.5, 51.5], [-79.5, 47.5], [-74.3, 45.0]]
  },

  // --- Indian State Borders ---
  {
    name: 'Maharashtra - Gujarat Border',
    country: 'India',
    coords: [[72.8, 20.3], [73.5, 21.0], [74.3, 21.5]]
  },
  {
    name: 'Maharashtra - Madhya Pradesh Border',
    country: 'India',
    coords: [[74.3, 21.5], [76.5, 21.4], [79.0, 21.8], [80.5, 21.3]]
  },
  {
    name: 'Maharashtra - Telangana Border',
    country: 'India',
    coords: [[77.5, 19.8], [78.8, 19.3], [79.9, 18.8]]
  },
  {
    name: 'Maharashtra - Karnataka Border',
    country: 'India',
    coords: [[73.8, 15.8], [74.5, 16.5], [76.0, 17.2], [77.5, 17.8]]
  },
  {
    name: 'Telangana - Andhra Pradesh Border',
    country: 'India',
    coords: [[77.8, 16.2], [79.3, 16.8], [80.8, 17.2]]
  },
  {
    name: 'Karnataka - Tamil Nadu Border',
    country: 'India',
    coords: [[76.8, 11.8], [77.8, 12.5], [78.5, 12.8]]
  },
  {
    name: 'Tamil Nadu - Kerala Border',
    country: 'India',
    coords: [[76.5, 10.5], [77.0, 9.5], [77.3, 8.5]]
  },
  {
    name: 'Uttar Pradesh - Bihar Border',
    country: 'India',
    coords: [[83.9, 27.2], [84.2, 25.8], [83.3, 24.5]]
  },
  {
    name: 'Rajasthan - Madhya Pradesh Border',
    country: 'India',
    coords: [[74.0, 24.5], [75.5, 24.8], [77.0, 25.5], [78.5, 26.8]]
  },

  // --- Australian State Borders ---
  {
    name: 'Western Australia - South Australia / NT Border',
    country: 'Australia',
    coords: [[129.0, -14.8], [129.0, -26.0], [129.0, -31.7]]
  },
  {
    name: 'South Australia - Northern Territory Border',
    country: 'Australia',
    coords: [[129.0, -26.0], [138.0, -26.0]]
  },
  {
    name: 'Queensland - South Australia / NSW Border',
    country: 'Australia',
    coords: [[138.0, -26.0], [141.0, -26.0], [141.0, -29.0], [153.5, -28.2]]
  },
  {
    name: 'New South Wales - Victoria Border',
    country: 'Australia',
    coords: [[141.0, -34.0], [143.0, -35.2], [147.0, -36.0], [149.9, -37.5]]
  },

  // --- European Regional / Provincial Divisions ---
  {
    name: 'Bavaria (Bayern) Border Segment',
    country: 'Germany',
    coords: [[9.0, 50.2], [10.5, 50.5], [12.2, 50.3], [13.8, 48.8], [12.8, 47.5], [10.5, 47.5], [9.5, 47.8], [9.0, 50.2]]
  },
  {
    name: 'Catalonia Regional Border Segment',
    country: 'Spain',
    coords: [[0.2, 40.5], [0.5, 41.5], [0.8, 42.8], [3.2, 42.4], [2.2, 41.4], [0.2, 40.5]]
  },
  {
    name: 'Lombardy Regional Border Segment',
    country: 'Italy',
    coords: [[8.6, 45.0], [8.6, 46.2], [10.5, 46.5], [10.6, 45.0], [8.6, 45.0]]
  }
];
