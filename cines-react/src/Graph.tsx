import { useRef, useEffect } from 'react';
import geo, { Map } from 'geojs';

interface GraphProps {
  nodeColor: string,
  edgeColor: string,
  layout: string,
};

function Graph({ nodeColor, edgeColor, layout }: GraphProps) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<GeojsMap | null>(null);

  const mapStyle = {
    width: "100%",
    height: "calc(100vh - 64px)",
    padding: 0,
    margin: 0,
    overflow: "hidden",
  };

  // Initialize the geojs map.
  useEffect(() => {
    map.current = geo.map({
      node: div.current,
      center: {x: 0, y: 0},
      zoom: 0,
      gcs: "+proj=longlat +axis=enu",
      ingcs: "+proj=longlat +axis=enu",
      maxBounds: {
        left: -100,
        right: 100,
        bottom: -100,
        top: 100,
      },
    });

    if (!map.current) {
      throw new Error("map was not initialized");
    }

    map.current.createLayer("osm");
  }, []);

  return (
    <div ref={div} style={mapStyle} />
  );
}

export default Graph;
