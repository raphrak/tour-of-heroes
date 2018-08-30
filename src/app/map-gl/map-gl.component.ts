import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CoreConfigService } from '../core-config.service';

const mapboxgl = (window as any).mapboxgl;

export interface IPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Component({
  selector: 'map-gl',
  templateUrl: './map-gl.component.html',
  styleUrls: ['./map-gl.component.css']
})
export class MapGLComponent implements AfterViewInit {

  @Input() position: IPosition = {
    latitude: 51.4904237,
    longitude: -0.2239924
  };
  @Input() zoom: number = 2;
  @Input() minZoom: number;
  @Input() maxZoom: number;

  @ViewChild('mapContainer') mapContainer: ElementRef;

  protected static idCounter: number = 0;
  protected map: any;
  protected mapId: string;

  constructor(protected coreConfig: CoreConfigService) {
    this.mapId = 'mapbox-' + MapGLComponent.idCounter++;
  }

  ngAfterViewInit() {
    (mapboxgl as any).accessToken = this.coreConfig.getKey('mapboxKey');
    this.initMap();
  }

  initMap() {
    // Basic map setup
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v10',
      center: [this.position.longitude, this.position.latitude],
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      zoom: this.zoom
    });
  }

}
