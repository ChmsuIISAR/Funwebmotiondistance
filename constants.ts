import { BuildingType, NodePoint, VehicleConfig, VehicleType } from './types';

export const GRID_COLS = 25; 
export const GRID_ROWS = 18; // Adjusted slightly for the J-centric layout
export const DEFAULT_GRID_SCALE = 10; // 10 meters per square

export const VEHICLES: Record<VehicleType, VehicleConfig> = {
  [VehicleType.CAR]: {
    type: VehicleType.CAR,
    name: "Car",
    baseSpeed: 20,
    maxSpeed: 40,
    isAdjustable: true,
    color: "#f59e0b", // Amber
    icon: "🚗"
  }
};

// Map Layout: Snake Pattern A -> J based on provided image.
// A (Start) -> B -> C -> D -> E -> F -> G -> H -> I -> J (Finish)
// Center X is 12.
export const NODES: NodePoint[] = [
  // Row 1: A -> B (Right)
  { id: 'A', label: 'A', x: 12, y: 3, type: BuildingType.HOUSE, name: 'House' },
  { id: 'B', label: 'B', x: 21, y: 3, type: BuildingType.CORNER, name: 'Corner B', isFinishOption: true },

  // Row 2: C (Down) -> D (Left) -> E (Left)
  { id: 'C', label: 'C', x: 21, y: 7, type: BuildingType.HOSPITAL, name: 'Hospital', isFinishOption: true },
  { id: 'D', label: 'D', x: 12, y: 7, type: BuildingType.SCHOOL, name: 'School', isFinishOption: true },
  { id: 'E', label: 'E', x: 3, y: 7, type: BuildingType.CORNER, name: 'Corner E', isFinishOption: true },

  // Row 3: F (Down) -> G (Right) -> H (Right)
  { id: 'F', label: 'F', x: 3, y: 11, type: BuildingType.TOWER, name: 'Tower', isFinishOption: true },
  { id: 'G', label: 'G', x: 12, y: 11, type: BuildingType.FARM, name: 'Farm', isFinishOption: true },
  { id: 'H', label: 'H', x: 21, y: 11, type: BuildingType.CORNER, name: 'Corner H', isFinishOption: true },

  // Row 4: I (Down) -> J (Left, Finish)
  { id: 'I', label: 'I', x: 21, y: 15, type: BuildingType.SHOP, name: 'Shop', isFinishOption: true },
  { id: 'J', label: 'J', x: 12, y: 15, type: BuildingType.FINISH, name: 'Finish Line', isFinishOption: true },
];

// PASTE YOUR NEW IMAGE LINKS INSIDE THE QUOTES BELOW
export const BUILDING_IMAGES: Record<BuildingType, string> = {
  [BuildingType.HOUSE]: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
  [BuildingType.HOSPITAL]: "https://cdn-icons-png.flaticon.com/512/4320/4320371.png",
  [BuildingType.SCHOOL]: "https://cdn-icons-png.flaticon.com/512/167/167707.png",
  
  // Tower
  [BuildingType.TOWER]: "https://cdn-icons-png.flaticon.com/128/1917/1917539.png", 
  
  // Updated Farm
  [BuildingType.FARM]: "https://cdn-icons-png.flaticon.com/128/2548/2548679.png",
  
  // Updated Shop
  [BuildingType.SHOP]: "https://cdn-icons-png.flaticon.com/128/273/273177.png", 
  
  // Updated Finish Line
  [BuildingType.FINISH]: "https://cdn-icons-png.flaticon.com/128/4768/4768216.png",
  [BuildingType.CORNER]: ""
};

export const COLORS = {
  grid: '#334155', // Slate 700
  gridBackground: '#0f172a', // Slate 900
  path: '#fbbf24', // Amber 400
  displacement: '#ef4444', // Red 500
  text: '#ffffff',
  highlight: '#3b82f6'
};