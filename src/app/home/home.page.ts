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

  private apiURL = 'http://localhost:32800/api/v2/buildings';
  buildings: any[] = [];
  private map!: L.Map;
  private currentPolygon: L.Polygon | null = null;
  displayStyle: string = 'none';
  isVisible: boolean = false;
  
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.initMap();
  }

  ionViewDidEnter() {
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
                console.log(`Building: "${building.levels}`);
                this.loadFloorButtons(building);
                this.drawRooms(building, 0); 
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

  drawRooms(building: any, selectedLevel: number): void {
    const selectedFloor = building.levels.find((level: any) => level.level === selectedLevel);
    if (!selectedFloor) {
      console.error(`Level ${selectedLevel} not found for the building.`);
      return;
    }
    this.isVisible = true;

    const rooms = selectedFloor.rooms;

    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
    }

    const roomCoordinates: L.LatLngExpression[][] = rooms.map((room: any) =>
      room.points.map((point: any) => [point.lat, point.lng])
    );

    this.currentPolygon = L.polygon(roomCoordinates, { color: 'grey' }).addTo(this.map);
  }

  loadFloorButtons(building: any) {
    const floorButtonsContainer = document.getElementById('floor-buttons');
    if (!floorButtonsContainer) return;

    floorButtonsContainer.innerHTML = '';
    building.levels.forEach((level: any, index: number) => {
      const button = document.createElement('ion-button');
      button.innerText = `OG ${index}`;
      button.addEventListener('click', () => {
        console.log(`Floor ${index}`);
        this.drawRooms(building, level.level);
      });
      floorButtonsContainer.appendChild(button);
    });
  }

  clearRooms() {
    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
      this.currentPolygon = null;
      const btns = document.getElementById('floor-buttons');
      if (!btns) return;
      btns.innerHTML = '';
      this.isVisible = false;
    }
  }

  getBuildings(): Observable<any> {
    return this.http.get(this.apiURL);
  }
}
