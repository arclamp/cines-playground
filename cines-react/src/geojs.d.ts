declare module 'geojs';

interface MapSpec {
  node: HTMLDivElement;
  center: {
    x: number;
    y: number;
  }
  zoom: number;
  gcs: string;
  ingcs: string;
  maxBounds: {
    left: number;
    right: number;
    bottom: number;
    top: number;
  }
}

declare class GeojsMap {
  createLayer(layerType: string): void;
}

declare function map(spec: MapSpec): GeojsMap;
