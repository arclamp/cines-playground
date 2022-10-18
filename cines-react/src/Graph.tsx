import { useRef, useEffect } from 'react';
import geo from 'geojs';
import { GraphData, Node, Edge } from './util';

interface GraphProps {
  graphData: GraphData;
  nodeColor: string;
  edgeColor: string;
  layout: string;
};

function Graph({ graphData, nodeColor, edgeColor, layout }: GraphProps) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<GeojsMap | null>(null);
  const line = useRef<LineFeature | null>(null);
  const marker = useRef<MarkerFeature | null>(null);
  const nodes = useRef<Node[]>([]);
  const edges = useRef<Edge[]>([]);

  const mapStyle = {
    width: "100%",
    height: "calc(100vh - 64px)",
    padding: 0,
    margin: 0,
    overflow: "hidden",
  };

  function updateGraph() {
    nodes.current = graphData.nodes;
    edges.current = graphData.edges;

    for (let e of edges.current) {
      if (typeof e.source === "number") {
        e.source = nodes.current[e.source];
      }

      if (typeof e.target === "number") {
        e.target = nodes.current[e.target];
      }
    }

    for (let n of nodes.current) {
      n.x = 100 * (Math.random() - 0.5) * 2;
      n.y = 100 * (Math.random() - 0.5) * 2;
    }

    console.log(nodes.current, edges.current);

    if (!marker.current || !line.current) {
      throw new Error("error");
    }

    marker.current.data(nodes.current).draw();
    line.current.data(edges.current).draw();
  }

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

    const layer = map.current.createLayer("feature", {
      features: ["marker", "line"],
    });

    line.current = layer.createFeature("line")
      .line((item: LineSpec) => {
        return [
          [item.source.x, item.source.y],
          [item.target.x, item.target.y],
        ];
      })
      .style({
        strokeColor: "blue",
        strokeWidth: 1,
      });

    marker.current = layer.createFeature("marker")
      .style({
        strokeColor: "black",
        fillColor: (d) => d.fixed ? "blue" : "red",
        scaleWithZoom: geo.markerFeature.scaleMode.all,
        radius: 2,
        strokeWidth: 0.05,
      });

    updateGraph();
  }, []);

  useEffect(() => {
    updateGraph();
  }, [graphData]);

  return (
    <div ref={div} style={mapStyle} />
  );
}

export default Graph;
