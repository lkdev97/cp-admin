import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccesspointValidatorService } from '../validators/accesspoint-validator.service';
import { BuildingService } from '../services/building.service';
import { CalibrationpointService } from '../services/calibrationpoint.service';
import { AccesspointService } from '../services/accesspoint.service';
import { CalibrationPoint, Fingerprint, WifiData } from '../models/calibrationpoint';
import { AccessPoint } from '../models/accesspoint';
import { Platform } from '@ionic/angular';
import { WifiWizard2 } from '@ionic-native/wifi-wizard-2/ngx';
import { DeviceOrientation, DeviceOrientationCompassHeading } from '@ionic-native/device-orientation/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  buildings: any[] = [];
  private map!: L.Map;
  private currentPolygon: L.Polygon | null = null;
  private centerLatLng : L.LatLngExpression = [50.58693, 8.68239];
  private circles: any[] = [];
  private accessPointCircles: any[] = [];
  private selectedAccessPointCircles: any[] = [];
  isVisible: boolean = false;
  selectedBuilding: String = '';
  selectedFloor: String = '';
  calibrationPoints: any[] = [];
  accesspointForm: FormGroup;
  accessPoints: any[] = [];
  networks: any[] = [];
  direction: number = 0;
  heading: number = 0;
  

  constructor(private modalController: ModalController, 
    private toastController: ToastController,
    private alertController: AlertController,
    private platform: Platform,
    private fb: FormBuilder, 
    private deviceOrientation: DeviceOrientation,
    private wifiWizard: WifiWizard2,
    private _buildingService: BuildingService, 
    private _accessPointService: AccesspointService,
    private _calibrationPointService: CalibrationpointService) {
    this.accesspointForm = this.fb.group({
      bssid: ['', [Validators.required, AccesspointValidatorService.bssidValidator]],
      ssid: ['', Validators.required],
      lat: ['', [Validators.required, AccesspointValidatorService.latitudeValidator]],
      lng: ['', [Validators.required, AccesspointValidatorService.longitudeValidator]],
      description: [''],
      floor: [''],
      building: ['']
    });
   }

  ngOnInit() {
    this.initMap();
    this.loadAccesspoints();
    this.loadBuildings();
    if (this.platform.is('android')) {
      setInterval(() => {
        this.scanWifi();
      }, 100);
      this.startCompass();
    }
  }

  startCompass() {
    this.deviceOrientation.watchHeading().subscribe(
      (data: DeviceOrientationCompassHeading) => {
        this.heading = Math.floor(data.magneticHeading);
      }
    );
  }

  loadAccesspoints(): void {
    this._accessPointService.getAccessPoints().subscribe((accessPoints: AccessPoint[]) => {
      this.accessPoints = accessPoints;
    });
  }

  loadBuildings(): void { 
    this._buildingService.getBuildings().subscribe((data: any) => {
      this.buildings = data?.buildings?.content;
    });
  }

  async scanWifi() {
    try {
      const results = await this.wifiWizard.scan();
      console.log('networks:', results);

      this.networks = results.filter((network: any) => {
        return this.accessPoints.some(ap => ap.bssid === network.BSSID);
      }).map((network: any) => {
        const matchingAP = this.accessPoints.find(ap => ap.bssid === network.BSSID);
        return {
          ...network,
          lat: matchingAP?.lat, 
          lng: matchingAP?.lng,
          floor: matchingAP?.floor,
          description: matchingAP?.description
        };
      });
    } catch (error) {
      console.error('Fehler beim Scannen der Netzwerke:', error);
    }
  }

  ionViewDidEnter() {
    this._buildingService.getBuildings().subscribe(
      (data: any) => {
        console.log('Data:', data);
  
        this.buildings = data?.buildings?.content;
  
        if (this.buildings && this.buildings.length > 0) {
          this.buildings.forEach((building: any) => {
            if (building.shell && building.shell.points) {
              const buildingCoordinates: L.LatLngExpression[] = building.shell.points.map((point: any) => [point.lat, point.lng]);
              const polygon = L.polygon(buildingCoordinates, { color: 'blue', weight: 1 })
                .addTo(this.map)
                .on('click', () => {
                  this.map.setView(buildingCoordinates[0], 20);
                  console.log(`clicked on building ${building.name}`);
                  console.log(`Building: "${building.levels}`);
                  this.loadFloorButtons(building);
                  this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
                    this.selectedFloor = "0";
                    this.selectedBuilding = building.name.replace(/\s/g, '');
                    this.drawRooms(building, 0); 
                    this.drawCalibrationPoints(0, calibrationPoints);
                    this.drawAccessPoints();
                  });
                })
                .on('mouseover', function () {
                  polygon.setStyle({ color: 'rgba(0, 0, 255, 0.7)' });
                })
                .on('mouseout', function () {
                  polygon.setStyle({ color: 'blue' });
                });
            }
          });
        }
      },
    );
  }

  initMap() {
    this.map = L.map('map').setView(this.centerLatLng, 19);
  
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

  drawAccessPoints(): void {
    const wifiIcon = L.icon({
      iconUrl: './assets/icon/wifi-outline.png',
      iconSize: [20, 20],
    });
  
    this.removeAccessPoints();
    //this._accessPointService.getAccessPoints().subscribe((accessPoints: AccessPoint[]) => {
      //this.accessPoints = accessPoints; 
      const filteredAccessPoints = this._accessPointService.filterAccessPoints(this.accessPoints, this.selectedFloor, this.selectedBuilding);
      filteredAccessPoints.forEach((filteredAccessPoint: any) => {
        const accessPointCircle = L.marker([filteredAccessPoint.lat, filteredAccessPoint.lng], { icon: wifiIcon }).addTo(this.map).bindTooltip(`Accesspoint: ${filteredAccessPoint.bssid}`);
        this.accessPointCircles.push(accessPointCircle);
      })
    //});
  }

  drawAccessPoint(latlng: L.LatLngExpression, bssid: number): L.Marker { 
    const wifiIcon = L.icon({
      iconUrl: './assets/icon/wifi-outline.png',
      iconSize: [20, 20],
    });
    return L.marker(latlng, { icon: wifiIcon }).addTo(this.map).bindTooltip(`Accesspoint: ${bssid}`);
  }

  removeAccessPoints(): void {
    this.accessPointCircles.forEach((accessCircle) => { 
      this.map.removeLayer(accessCircle);
    });
    this.accessPointCircles = [];
  }

  drawRooms(building: any, selectedLevel: number): void {
    const selectedFloor = building.levels.find((level: any) => level.level === selectedLevel);
    if (!selectedFloor) {
      console.error(`Level ${selectedLevel} not found for the building.`);
      return;
    }

    this.accesspointForm.patchValue({
      floor: this.selectedFloor,
      building: this.selectedBuilding
    });

    this.isVisible = true;
    const rooms = selectedFloor.rooms;

    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
    }

    const roomCoordinates: L.LatLngExpression[][] = rooms.map((room: any) =>
      room.points.map((point: any) => [point.lat, point.lng])
    );
    
    this.currentPolygon = L.polygon(roomCoordinates, { color: 'grey'})
      .addTo(this.map)
      .on('click', (e) => {
        e.target.bindPopup(`Add new Calibrationpoint! <br>Building: ${this.selectedBuilding}<br>Floor: ${this.selectedFloor} <br> Latitude: ${e.latlng.lat} <br> Longitude: ${e.latlng.lng} <br> <ion-button id="closePopupBtn" color="danger" fill="outline"><ion-icon name="close-outline"></ion-icon></ion-button><ion-button id="addCpBtn" color="success" fill="outline"><ion-icon name="checkmark-outline"></ion-icon></ion-button>`).openPopup();
        this.map.setView([e.latlng.lat, e.latlng.lng], this.map.getZoom(), {animate: false});
        setTimeout(() => {
          document.getElementById("addCpBtn")?.addEventListener("click", () => {
            const filterAccesspoints = this._accessPointService.filterAccessPoints(this.accessPoints, this.selectedFloor, this.selectedBuilding);
            const WifiData: WifiData[] = [];
            filterAccesspoints.forEach((filterAccesspoint: AccessPoint) => {
              WifiData.push(this._calibrationPointService.buildWifiData(filterAccesspoint.bssid, 2472, 0, 0));
            });
            const newCalibrationPoint: CalibrationPoint[] = [this._calibrationPointService.buildCalibrationPoint(e.latlng.lat, e.latlng.lng, this.selectedFloor, this.selectedBuilding, [])];
            console.log("newCalibrationPoint ", newCalibrationPoint);
            this._calibrationPointService.addCalibrationPoint(newCalibrationPoint).subscribe(
              async response => {
                console.log('Calibration point added successfully:', response);
                this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
                  this.removeCalibrationPoints();
                  this.drawCalibrationPoints(selectedLevel, calibrationPoints);
                  this.currentPolygon?.closePopup();
                  this.presentScanAlert(this.calibrationPoints[this.calibrationPoints.length - 1]);
                });
                await this.showToast('Calibration point added successfully', 'success');
              },
              error => {
                console.error('Error adding calibration point:', error);
              }
            );
            console.log("ADD: ", e);
          });
          document.getElementById("closePopupBtn")?.addEventListener("click", () => {
            this.currentPolygon?.closePopup();
          });
        }, 0);
        console.log("Add CP ", e);
    });

  }

  drawCalibrationPoints(selectedLevel: number, calibrationPoints: any): void {
    this.removeCalibrationPoints();
    this.calibrationPoints = calibrationPoints.filter((x: any) => x.floor == selectedLevel && x.building == this.selectedBuilding);
    console.log(this.calibrationPoints);
    this.calibrationPoints.forEach((data: any) => {
      let color = 'grey';
      if (data.fingerprints && data.fingerprints.length > 0) { 
        if(data.fingerprints[0].accessPoints.length == 0) color = 'grey';
        else if(data.fingerprints[0].accessPoints.length <= 2) color = 'red';
        else if(data.fingerprints[0].accessPoints.length <= 3) color = 'yellow';
        else color = 'green';
      } 
      const accessPointsCount = (data.fingerprints && data.fingerprints.length > 0 && data.fingerprints[0].accessPoints && data.fingerprints[0].accessPoints.length > 0) ? data.fingerprints[0].accessPoints.length : 0;
      const circle = L.circle([data.lat, data.lng], 0.5, { color: color, fillOpacity: 1 })
      .addTo(this.map)
      .bindTooltip(`ID: ${data.id} <br> Latitude: ${data.lat} <br> Longitude: ${data.lng} <br>Accesspoints: ${accessPointsCount}`)
      .bindPopup(`ID: ${data.id} <br> Latitude: ${data.lat} <br> Longitude: ${data.lng} <br>Accesspoints: ${accessPointsCount}<br> <ion-button id="edit-cp" fill="clear"><ion-icon name="create-outline"></ion-icon></ion-button><ion-button id="delete-cp" fill="clear"><ion-icon name="trash-outline"></ion-icon></ion-button>`, { closeOnClick: false, autoClose: true })
      .on('click', (e) => {
        this.map.setView([data.lat, data.lng],this.map.getZoom() , { animate: false });
        console.log("clicked calibrationpoint: ", e.target);
        e.target.openPopup();
        setTimeout(() => {
          document.getElementById('edit-cp')?.addEventListener("click", () => {
            this.startScan(data);
          });
          document.getElementById('delete-cp')?.addEventListener("click", () => {
            this._calibrationPointService.removeCalibrationPoint(data.id).subscribe(
              response => {
                this.map.removeLayer(e.target);
                console.log(response); 
                this.showToast(`Calibrationpoint with ID: ${data.id} deleted`, 'fail')
              }
            );
          });
        }, 0);
        if (data.fingerprints && data.fingerprints.length > 0) {
          data.fingerprints[0].accessPoints.forEach((x: any) => {
            this.selectedAccessPointCircles.push(this.drawAccessPoint([x.lat, x.lng], x.bssid)); 
            const accessPointCircle = L.circle([x.lat, x.lng], 0.5, { color: 'rgba(99, 197, 199, 0.8)', fillOpacity: 1 }).addTo(this.map).bindTooltip(`Accesspoint: ${x.bssid}`);
            this.selectedAccessPointCircles.push(accessPointCircle);
          });
        }
      })
      .on('popupclose', () => { 
        this.selectedAccessPointCircles.forEach((accessCircle) => { 
          this.map.removeLayer(accessCircle);
        });
        this.selectedAccessPointCircles = [];
      });
      
      this.circles.push(circle);
    });
  }

  loadFloorButtons(building: any) {
    const floorButtonsContainer = document.getElementById('floor-buttons');
    if (!floorButtonsContainer) return;

    floorButtonsContainer.innerHTML = '';
    this.selectedFloor = "0";
    building.levels.forEach((level: any, index: number) => {
      const button = document.createElement('ion-button');
      button.setAttribute("class", "select-btn");
      level.level == this.selectedFloor ? button.setAttribute("color", "primary") : button.setAttribute("color", "dark");
      level.level >= 0 ? button.innerText = `OG ${level.level}` : button.innerText = `UG ${Math.abs(level.level)}`;
      button.addEventListener('click', () => {
        console.log(`Floor ${index}`);
        const selectBtns = document.querySelectorAll('.select-btn'); 
        selectBtns.forEach((floorButton: Element) => { 
          floorButton.setAttribute("color", "dark");
        });
        button.setAttribute("color", "primary");
        this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
          this.selectedFloor = level.level;
          this.selectedBuilding = building.name.replace(/\s/g, '');
          this.drawRooms(building, level.level);
          this.drawCalibrationPoints(level.level, calibrationPoints);
          this.drawAccessPoints();
        });
        
      });
      floorButtonsContainer.prepend(button);
    });
    floorButtonsContainer.appendChild(this.createExitBtn());
  }

  createExitBtn(): HTMLIonButtonElement {
    const exitBtn = document.createElement('ion-button');
    const exitIcon = document.createElement('ion-icon');
    exitBtn.setAttribute("color", "danger");
    exitIcon.setAttribute("name", "exit-outline");
    exitBtn.appendChild(exitIcon);
    exitBtn.addEventListener("click", this.clearRooms.bind(this));
    return exitBtn;
  }
  
  removeCalibrationPoints(): void {
    if (this.circles) {
      this.circles.forEach(x => {
        this.map.removeLayer(x);
      });
      this.circles = [];
    }
  }

  clearRooms() {
    if (this.currentPolygon) {
      this.map.removeLayer(this.currentPolygon);
      this.currentPolygon = null;
      const btns = document.getElementById('floor-buttons');
      if (!btns) return;
      btns.innerHTML = '';
      this.isVisible = false;
      this.centerView();
      this.removeCalibrationPoints();
      this.removeAccessPoints();
    }
  }

  async dismissModal() {
    await this.modalController.dismiss();
  }

  centerView() {
    if(this.currentPolygon) {
      this.buildings.filter((x: any) => this.selectedBuilding === x.name.replace(/\s/g, '')).forEach((data: any) => {
        this.map.setView(data.shell.points[0], 20);
      });
    }
    else this.map.setView(this.centerLatLng, 19);
  }

  addAccesspoint(): void {
    if (this.accesspointForm.valid) {
      const formValues = this.accesspointForm.value;
      if(!formValues.floor) formValues.floor = this.selectedFloor;
      if(!formValues.building) formValues.building = this.selectedBuilding;
      const accessPointData = {
        ...formValues,
      };

      this._accessPointService.addAccesspoint(accessPointData).subscribe(
        response => { 
          this.showToast(`${response}`, 'success');          
          this.removeCalibrationPoints();
          this.drawCalibrationPoints(formValues.floor, this.calibrationPoints);
          this.drawAccessPoints();
        }, 
        error => {
          this.showToast(`${error.error}`, 'fail'); 
        }
      );
    }
  }
  
  async showToast(message: string, type: 'success' | 'fail') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: type === 'success' ? 'success' : 'danger',
    });
    toast.present();
  }

  async presentScanAlert(calibrationpoint: CalibrationPoint) {
    const alert = await this.alertController.create({
      header: "Scan starten",
      message: "Möchten Sie den Scan der Accesspoints jetzt starten?",
      buttons: [
        {
          text: 'Später',
        }, {
          text: 'Ja',
          handler: () => this.startScan(calibrationpoint),
        }
      ]
    });

    await alert.present();
  }

  async startScan(calibrationpoint: CalibrationPoint) {
    if (!this.platform.is('mobile')) {
      this.showToast("Scan is only supported on an Android phone. Please change your device.", "fail");
      return;
    }
    calibrationpoint.fingerprints = []; // Falls bei einem bestehenden Kalibrierungspunkt erneut Scan's durchgeführt werden sollen z.B. weil neue Accesspoints hinzugefügt wurden

    const directions = [
      'Norden (0°)',
      'Osten (90°)',
      'Süden (180°)',
      'Westen (270°)'
    ];
  
    for (const direction of directions) {
      await this.showScanModal(direction);
      this.scanAccesspoints(calibrationpoint);
    }
    this.showToast("Der Scan wurde erfolgreich beendet", "success");
    this._calibrationPointService.getCalibrationPoints().subscribe((calibrationPoints: any) => {
      this.removeCalibrationPoints();
      this.drawCalibrationPoints(parseInt(this.selectedFloor.toString()), calibrationPoints);
      this.drawAccessPoints();
    });
  }

  scanAccesspoints(calibrationpoint: CalibrationPoint) {
    const newFingerprint: Fingerprint = {
      accessPoints: [],
      azimuthInDegrees: this.heading,
      wifiData: []
    };
  
    this.networks.forEach(network => {
      const newWifiData: WifiData = this._calibrationPointService.buildWifiData(
        network.BSSID,
        network.frequency,
        network.level,
        Date.now()
      );
  
      const ap: AccessPoint = this._accessPointService.buildAccessPoint(
        network.BSSID,
        network.SSID,
        network.lat,
        network.lng,
        network.floor,
        network.description
      );
  
      newFingerprint.wifiData.push(newWifiData);
      newFingerprint.accessPoints.push(ap);
    });
  
    calibrationpoint.fingerprints.push(newFingerprint);
  
    // Update the calibration point in the service 
    // @TODO: bug in backend-service, put api doesnt set id of new fingerprint in calibrationpoint
    this._calibrationPointService.editCalibrationPoint(calibrationpoint).subscribe(
      response => {
        console.log("cp updated successfully with new fingerprint:", response);
      },
      error => {
        console.error("Error updating calibration point:", error);
      }
    );
  }
  
  async showScanModal(direction: string): Promise<void> {
    const modal = document.getElementById('scan-modal') as HTMLIonModalElement;

    await modal.present();
  
    const modalTitle = modal.querySelector('#modal-title');
    const modalText = modal.querySelector('#modal-text');
    const scanBtn = modal.querySelector('#scan-btn');
  
    return new Promise((resolve) => {
      if (modalTitle && modalText && scanBtn) {
        modalTitle.textContent = `Scanne in Richtung ${direction}`;
        modalText.textContent = `Bitte richten Sie Ihr Gerät nach ${direction} aus und drücken Sie auf "Scan starten", um den Scan zu starten.`;
  
        scanBtn.addEventListener('click', () => {
          modal.dismiss(); 
          resolve(); 
        }, { once: true }); 
      } else {
        console.error("Modal elements not found!");
        resolve(); 
      }
    });
  }

  getAccessPointCount(calibrationPoint: any): number {
    return calibrationPoint.fingerprints && calibrationPoint.fingerprints.length > 0 && calibrationPoint.fingerprints[0].accessPoints ? calibrationPoint.fingerprints[0].accessPoints.length: 0;
  }

  reloadPage() {
    window.location.reload();
  }
}
