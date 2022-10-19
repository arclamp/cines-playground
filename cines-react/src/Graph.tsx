import { useRef, useEffect } from 'react';
import geo from 'geojs';
import { forceSimulation, forceCenter, forceManyBody, forceCollide, forceLink, Simulation } from 'd3-force';
import { GraphData, Node, Edge } from './util';

interface GraphProps {
  graphData: GraphData;
  nodeColor: string;
  edgeColor: string;
  layout: string;
};

const dummyForce: Simulation<Node, Edge> = forceSimulation();

function Graph({ graphData, nodeColor, edgeColor, layout }: GraphProps) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<GeojsMap | null>(null);
  const line = useRef<LineFeature | null>(null);
  const marker = useRef<MarkerFeature | null>(null);
  const nodes = useRef<Node[]>([]);
  const edges = useRef<Edge[]>([]);
  const sim = useRef<Simulation<Node, Edge>>(dummyForce);

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

    console.log(nodes.current, edges.current);

    if (!marker.current || !line.current) {
      throw new Error("error");
    }

    sim.current.nodes(nodes.current)
      .force("link", forceLink(edges.current).distance(10))
      .restart();
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
        strokeColor: edgeColor,
        strokeWidth: 1,
      });

    marker.current = layer.createFeature("marker")
      .style({
        strokeColor: "black",
        fillColor: (d) => d.fixed ? "blue" : nodeColor,
        scaleWithZoom: geo.markerFeature.scaleMode.all,
        radius: 2,
        strokeWidth: 0.05,
      });

    sim.current = forceSimulation(nodes.current)
      .force("center", forceCenter())
      .force("collide", forceCollide().radius(3))
      .force("link", forceLink(edges.current).distance(10))
      .force("charge", forceManyBody().strength(-2))
      .on("tick", () => {
        marker.current!.data(nodes.current).draw();
        line.current!.data(edges.current).draw();
      });

    updateGraph();
  }, []);

  useEffect(() => {
    updateGraph();
  }, [graphData]);

  useEffect(() => {
    if (marker.current) {
      marker.current.style({
        fillColor: (d) => d.fixed ? "blue" : nodeColor,
      })
        .draw();
    }
  }, [nodeColor]);

  useEffect(() => {
    if (line.current) {
      line.current.style({
        strokeColor: edgeColor,
      })
        .draw();
    }
  }, [edgeColor]);

  return (
    <div ref={div} style={mapStyle} />
  );
}

export default Graph;
