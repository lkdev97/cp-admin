import { AccessPoint } from "./accesspoint";

export interface CalibrationPoint {
    lat: number;
    lng: number;
    floor: String;
    building: String;
    fingerprints: Fingerprint[];
    
}
  
export interface Fingerprint {
    azimuthInDegrees: number;
    wifiData: WifiData[];
    accessPoints: AccessPoint[];
}

export interface WifiData {
    bssid: String;
    frequency: number;
    level: number;
    timestamp: number;
}



  