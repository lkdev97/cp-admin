// src/app/home/home.page.ts
import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  private apiURL = 'https://mocainfo.thm.de/indoor-model/api/v2/buildings';
  buildings: any[] = [];
  private map!: L.Map;
  
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.initMap();
  
    this.getBuildings().subscribe(
      (data: any) => {
        console.log('Data:', data);
  
        const buildings = data?.buildings?.content;
  
        if (buildings && buildings.length > 0) {
          buildings.forEach((building: any) => {
            if (building.shell && building.shell.points) {
              const buildingCoordinates: L.LatLngExpression[] = building.shell.points.map((point: any) => [point.lat, point.lng]);
              const polygon = L.polygon(buildingCoordinates, { color: 'blue', weight: 1 }).addTo(this.map);
  
              polygon.on('click', () => {
                console.log(`clicked on building ${building.name}`);
              });

              polygon.on('mouseover', function () {
                polygon.setStyle({ color: 'rgba(0, 0, 255, 0.7)' });
              });

              polygon.on('mouseout', function () {
                polygon.setStyle({ color: 'blue' });
              });
            } 
          });
        } 
      },
    );
  }
  
  

  initMap() {
    this.map = L.map('map').setView([50.58693, 8.68239], 19);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 22,
      maxNativeZoom: 19
    }).addTo(this.map);
  
    setTimeout(() => {
      this.map.invalidateSize();
    }, 0);
  
    const markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41] 
    });
  
    L.marker([50.58693, 8.68239], { icon: markerIcon }).addTo(this.map)
      .bindPopup('THM, Gießen')
      .openPopup();
  }
  


  getBuildings(): Observable<any> {
    return this.http.get(this.apiURL);
  }
}
