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

interface Bounds {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

interface ZoomAndCenter {
  zoom: number;
  center: {
    x: number;
    y: number;
  };
}

class GeojsMap {
  createLayer(type: "feature", options: FeatureLayerOptions): FeatureLayer;
  createLayer(type: "ui", options: UiLayerOptions): UiLayer;
  layers(): UiLayer[];
  interactor(): any;
  zoomAndCenterFromBounds(bounds: Bounds, rotation: number);
  center({ x: number, y: number });
  zoom(zoom: number);
  screenshot(): Promise<string>;
}

interface GeojsEvent<T> {
  data: T;
  sourceEvent: {
    modifiers: {
      alt: boolean;
      ctrl: boolean;
      meta: boolean;
      shift: boolean;
    };
  };
  mouse: {
    geo: {
      x: number;
      y: number;
    };
  };
  state?: {
    origin: {
      geo: {
        x: number;
        y: number;
      };
    };
  };
}

declare class FeatureLayer {
  createFeature(type: "line"): LineFeature;
  createFeature(type: "marker"): MarkerFeature;
}

declare class UiLayer {
  createWidget(type: "dom", spec: {
    position: {
      x: number;
      y: number;
    };
  }): Widget
  deleteWidget(widget: Widget)
}

declare class Widget {
  canvas(): HTMLDivElement
  position({ x: number, y: number })
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

declare class LineFeature<T> {
  line(fn: (item: LineSpec) => [[number, number], [number, number]])
  style(spec: LineStyleSpec)
  data(data: T[])
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

declare class MarkerFeature<T> {
  style(spec: MarkerStyleSpec)
  data(data?: T[])
  geoOn(eventType: string, cb: (evt: any) => void)
  dataTime()
  modified()
  draw()
}

declare function map(spec: MapSpec): GeojsMap;
