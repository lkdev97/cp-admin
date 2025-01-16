import { AccessPoint } from "./accesspoint";

/**
 * Represents a CalibrationPoint
 */
export interface CalibrationPoint {
    lat: number;
    lng: number;
    floor: String;
    building: String;
    fingerprints: Fingerprint[];
    
}
  
/**
 * Represents a Fingerprint
 */
export interface Fingerprint {
    azimuthInDegrees: number;
    wifiData: WifiData[];
    accessPoints: AccessPoint[];
}

/**
 * Represents WifiData
 */
export interface WifiData {
    bssid: String;
    frequency: number;
    level: number;
    timestamp: number;
}



  