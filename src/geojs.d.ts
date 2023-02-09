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

interface FeatureLayerOptions {
  features: string[];
}

interface UiLayerOptions {
  zIndex: number;
}

declare class GeojsMap {
  createLayer(type: "feature", options: FeatureLayerOptions): FeatureLayer;
  createLayer(type: "ui", options: UiLayerOptions): UiLayer;
  layers(): UiLayer[];
  interactor(): any;
}

declare class FeatureLayer {
  createFeature(type: "line"): LineFeature;
  createFeature(type: "marker"): MarkerFeature;
}

interface LineSpec {
  source: {
    x: number;
    y: number;
  }
  target: {
    x: number;
    y: number;
  }
}

interface LineStyleSpec {
  strokeColor?: string;
  strokeWidth?: number;
}

declare class LineFeature {
  line(fn: (item: LineSpec) => [[number, number], [number, number]])
  style(spec: LineStyleSpec)
  data(data: any[])
  draw()
  dataTime()
}

interface MarkerStyleSpec {
    strokeColor?: string;
    fillColor?: (item: any) => string;
    scaleWithZoom?: 0 | 1 | 2 | 3;
    radius?: number | ((item: any) => number);
    strokeWidth?: number;
}

declare class MarkerFeature {
  style(spec: MarkerStyleSpec)
  data(data?: any[])
  geoOn(eventType: string, cb: (evt: any) => void)
  dataTime()
  modified()
  draw()
}

declare function map(spec: MapSpec): GeojsMap;
