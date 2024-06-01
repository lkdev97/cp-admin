import { AccessPoint } from "./accesspoint";

export class CalibrationPoint {
    lat: number;
    lng: number;
    floor: String;
    building: String;
    fingerprints: Fingerprint[];
    
    constructor(lat: number, lng: number, floor: String, building: String, fingerprints: Fingerprint[]) {
        this.lat = lat;
        this.lng = lng;
        this.floor = floor;
        this.building = building;
        this.fingerprints = fingerprints;
    }
    
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



  