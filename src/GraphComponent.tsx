import { Component, createRef, RefObject } from 'react';
import geo from 'geojs';
import { forceSimulation, forceCenter, forceManyBody, forceCollide, forceLink, Simulation } from 'd3-force';
import { GraphData, Node, Edge } from './util';

import type { NodeDatum } from './util';
import type { SimulationNodeDatum } from 'd3-force';

interface GraphProps {
  data: GraphData;
  nodeColor: string;
  edgeColor: string;
  layout: string;
};

interface Bounds {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

const mapStyle = {
  width: "100%",
  height: "calc(100vh - 64px)",
  padding: 0,
  margin: 0,
  overflow: "hidden",
};

class GraphComponent extends Component<GraphProps, never> {
  div: RefObject<HTMLDivElement>;
  nodes: Node[] = [];
  edges: any;
  map: GeojsMap = geo.map();
  line: any;
  marker: any;
  labels: any;
  sim: Simulation<Node, Edge>;

  constructor(props: GraphProps) {
    super(props);
    this.div = createRef<HTMLDivElement>();
    this.sim = forceSimulation();
  }

  componentDidMount() {
    if (!this.div) {
      throw new Error("GraphComponent: <div> was not initialized");
    }

    this.map = geo.map({
      node: this.div.current,
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

    this.labels = this.map.createLayer("ui", {
      zIndex: 2,
    });

    const layer = this.map.createLayer("feature", {
      features: [
        "marker",
        "line",
      ],
    });

    this.line = layer.createFeature("line")
      .line((item: LineSpec) => [
        [item.source.x, item.source.y],
        [item.target.x, item.target.y],
      ])
      .style({
        strokeWidth: 1,
      });
    this.styleLines();

    this.marker = layer.createFeature("marker")
      .style({
        strokeColor: "black",
        scaleWithZoom: geo.markerFeature.scaleMode.all,
        radius: (d: any) => Math.sqrt(d.degree),
        strokeWidth: 0.05,
      });
    this.styleNodes();

    const tooltips: {[index: number]: any} = {};
    this.marker.geoOn(geo.event.feature.mouseclick, (evt: any) => {
      const data = evt.data;
      const modifiers = evt.sourceEvent.modifiers;

      if (modifiers.shift) {
        // Pin/unpin a node by setting/deleting its fx/fy properties.
        data.fixed = !data.fixed;
        if (data.fixed) {
          data.fx = data.x;
          data.fy = data.y;
        } else {
          data.fx = data.fy = null;
        }

        // Kick the simulation.
        this.sim.alpha(0.3)
            .restart();
      } else {
        // Toggle the display of the node label.
        if (tooltips.hasOwnProperty(data.id)) {
          this.labels.deleteWidget(tooltips[data.id]);
          delete tooltips[data.id]
        } else {
          tooltips[data.id] = this.labels.createWidget("dom", {
            position: {
              x: data.x,
              y: data.y,
            },
          });

          const tt = tooltips[data.id].canvas();
          tt.textContent = `${data.id}${data.fixed ? " (fixed)": ""}: degree: ${data.degree}`;
        }
      }
    });

    let node: Node | null = null;
    let startPos = { x: 0, y: 0 };
    this.marker.geoOn(geo.event.feature.mouseon, (evt: any) => {
      node = evt.data;
      if (!node) {
        throw new Error("mouseon failed");
      }

      startPos = {
        x: node.x,
        y: node.y,
      };
      this.map.interactor().addAction({
        action: "dragnode",
        name: "myaction",
        owner: "me",
        input: "left",
      });
    }).geoOn(geo.event.actionmove, (evt: any) => {
      if (!node) {
        throw new Error("mouseon failed");
      }

      node.fx = startPos.x + evt.mouse.geo.x - evt.state.origin.geo.x;
      node.fy = startPos.y + evt.mouse.geo.y - evt.state.origin.geo.y;

      if (tooltips.hasOwnProperty(node.id)) {
        const tt = tooltips[node.id];
        tt.position({
          x: node.fx,
          y: node.fy,
        });
      }

      this.marker.dataTime().modified();
      this.marker.draw();

      this.line.dataTime().modified();
      this.line.draw();

      this.sim.alpha(0.3).restart();
    }).geoOn(geo.event.actionup, (evt: any) => {
      if (!node) {
        throw new Error("mouseon failed");
      }

      if (!node.fixed) {
        node.fx = node.fy = null;
      }

      this.map.interactor().removeAction(undefined, undefined, "me");
    });

    function isNodeDatum(d: SimulationNodeDatum): d is NodeDatum {
      return d.hasOwnProperty("degree");
    }

    this.sim = forceSimulation([] as Node[])
      .force("center", forceCenter())
      .force("collide", forceCollide().radius((d: SimulationNodeDatum) => {
        return isNodeDatum(d) ? Math.sqrt(d.degree) : 10;
      }))
      .force("charge", forceManyBody().strength(-2))
      .on("tick", () => {
        this.marker.data(this.nodes).draw();
        this.line.data(this.edges).draw();

        this.marker.data().forEach((d: Node) => {
          if (tooltips.hasOwnProperty(d.id)) {
            const tt = tooltips[d.id];
            tt.position({
              x: d.x,
              y: d.y,
            });
          }
        });
      });

    this.copyData();
  }

  componentDidUpdate(prevProps: GraphProps) {
    if (prevProps.nodeColor !== this.props.nodeColor) {
      this.styleNodes();
    }

    if (prevProps.edgeColor !== this.props.edgeColor) {
      this.styleLines();
    }

    if (prevProps.data !== this.props.data) {
      this.copyData();
    }
  }

  styleLines() {
    this.line.style({
      strokeColor: this.props.edgeColor,
    }).draw();
  }

  styleNodes() {
    this.marker.style({
      fillColor: (d: any) => d.fixed ? "blue" : this.props.nodeColor,
    }).draw();
  }

  copyData() {
    this.nodes = structuredClone(this.props.data.nodes);
    this.edges = structuredClone(this.props.data.edges);

    this.sim.nodes(this.nodes)
        .force("link", forceLink(this.edges).distance(10))
        .restart();
  }

  zoomToFit() {
    const bounds = this.marker.data().reduce((acc: Bounds, d: Node) => ({
      left: Math.min(d.x, acc.left),
      right: Math.max(d.x, acc.right),
      bottom: Math.min(d.y, acc.bottom),
      top: Math.max(d.y, acc.top),
    }), {left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity});

    /// @ts-ignore
    const bz = this.map.zoomAndCenterFromBounds(bounds, 0);

    /// @ts-ignore
    this.map.center(bz.center);

    /// @ts-ignore
    this.map.zoom(bz.zoom + Math.log2(0.8));
  }

  async screencap() {
    /// @ts-ignore
    return await this.map.screenshot();
  }

  render() {
    return (
      <div ref={this.div} style={mapStyle} />
    );
  }
}

export default GraphComponent;
