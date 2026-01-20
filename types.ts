export enum VehicleType {
  CAR = 'CAR'
}

export enum BuildingType {
  HOUSE = 'HOUSE',
  HOSPITAL = 'HOSPITAL',
  SCHOOL = 'SCHOOL',
  TOWER = 'TOWER',
  FARM = 'FARM',
  SHOP = 'SHOP',
  FINISH = 'FINISH',
  CORNER = 'CORNER'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface NodePoint extends Coordinates {
  id: string;
  label: string;
  type: BuildingType;
  name: string;
  isFinishOption?: boolean;
}

export interface SegmentData {
  from: string;
  to: string;
  distance: number;
  time: number;
  speed: number;
  direction: string;
  velocityLabel: string;
}

export interface SimulationResult {
  timeTaken: number;
  distanceTraveled: number;
  displacement: number;
  finalDestination: string;
  averageSpeed: number;
  averageVelocity: number;
  pathBreakdown: string;
  segmentData: SegmentData[];
}

export interface VehicleConfig {
  type: VehicleType;
  name: string;
  baseSpeed: number; // m/s
  maxSpeed?: number;
  isAdjustable: boolean;
  color: string;
  icon: string;
}