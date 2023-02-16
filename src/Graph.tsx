import { Component, createRef, RefObject } from 'react';
import geo from 'geojs';
import { forceSimulation, forceCenter, forceManyBody, forceCollide, forceLink, Simulation } from 'd3-force';
import { GraphNode, GraphEdge, GraphData, NodePosition } from './types';
import { cytoscapeLayout, isCytoscapeLayout } from './layout';

import type { SimulationNodeDatum } from 'd3-force';

interface GraphProps {
  data: GraphData;
  nodeColor: string;
  edgeColor: string;
  layout: string;
};

class Graph extends Component<GraphProps, never> {
  div: RefObject<HTMLDivElement>;
  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];
  map: GeojsMap = geo.map({ node: document.createElement("div") });
  line: LineFeature<GraphEdge> = this.map.createLayer("feature", { features: ["line"] }).createFeature("line");
  marker: MarkerFeature<GraphNode> = this.map.createLayer("feature", { features: ["marker"] }).createFeature("marker");
  tooltips: {[index: number]: Widget} = {};
  labels: UiLayer = this.map.createLayer("ui", { zIndex: 0 });
  sim: Simulation<GraphNode, GraphEdge>;
  forcesActive: boolean = true;

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
        radius: (d: GraphNode) => Math.sqrt(d.degree),
        strokeWidth: 0.05,
      });
    this.styleNodes();

    this.marker.geoOn(geo.event.feature.mouseclick, (evt: GeojsEvent<GraphNode>) => {
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
        this.startSimulation();
      } else {
        // Toggle the display of the node label.
        if (this.tooltips.hasOwnProperty(data.id)) {
          this.labels.deleteWidget(this.tooltips[data.id]);
          delete this.tooltips[data.id]
        } else {
          this.tooltips[data.id] = this.labels.createWidget("dom", {
            position: {
              x: data.x,
              y: data.y,
            },
          });

          const tt = this.tooltips[data.id].canvas();
          tt.textContent = `${data.id}${data.fixed ? " (fixed)": ""}: degree: ${data.degree}`;
        }
      }
    });

    let node: GraphNode | null = null;
    let startPos = { x: 0, y: 0 };
    this.marker.geoOn(geo.event.feature.mouseon, (evt: GeojsEvent<GraphNode>) => {
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
    }).geoOn(geo.event.actionmove, (evt: GeojsEvent<GraphNode>) => {
      if (!node || !evt.state) {
        throw new Error("mouseon failed");
      }

      node.fx = startPos.x + evt.mouse.geo.x - evt.state.origin.geo.x;
      node.fy = startPos.y + evt.mouse.geo.y - evt.state.origin.geo.y;

      if (this.forcesActive && this.tooltips.hasOwnProperty(node.id)) {
        const tt = this.tooltips[node.id];
        tt.position({
          x: node.fx,
          y: node.fy,
        });
      }

      this.marker.dataTime().modified();
      this.marker.draw();

      this.line.dataTime().modified();
      this.line.draw();

      this.startSimulation();
    }).geoOn(geo.event.actionup, (evt: GeojsEvent<GraphNode>) => {
      if (!node) {
        throw new Error("mouseon failed");
      }

      if (!node.fixed) {
        node.fx = node.fy = null;
      }

      this.map.interactor().removeAction(undefined, undefined, "me");
    });

    function isGraphNode(d: SimulationNodeDatum): d is GraphNode {
      return d.hasOwnProperty("degree");
    }

    this.sim = forceSimulation([] as GraphNode[])
      .force("center", forceCenter())
      .force("collide", forceCollide().radius((d: SimulationNodeDatum) => {
        return isGraphNode(d) ? Math.sqrt(d.degree) : 10;
      }))
      .force("charge", forceManyBody().strength(-2))
      .on("tick", () => {
        this.marker.data(this.nodes).draw();
        this.line.data(this.edges).draw();

        this.updateTooltipPositions();
      });

    this.copyData();

    this.applyLayout();
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

    if (prevProps.layout !== this.props.layout) {
      this.applyLayout();
    }
  }

  styleLines() {
    this.line.style({
      strokeColor: this.props.edgeColor,
    }).draw();
  }

  styleNodes() {
    this.marker.style({
      fillColor: (d: GraphNode) => d.fixed ? "blue" : this.props.nodeColor,
    }).draw();
  }

  applyLayout() {
      const layout = this.props.layout;

      if (isCytoscapeLayout(layout)) {
        this.stopSimulation({
          force: true,
        });
        this.forcesActive = false;

        const positions = cytoscapeLayout(this.nodes, this.edges, layout);
        this.updateNodePositions(positions);
      } else {
        this.forcesActive = true;
        this.startSimulation();
      }

      this.marker.data(this.nodes).draw();
      this.line.data(this.edges).draw();

      this.updateTooltipPositions();
  }

  copyData() {
    this.nodes = structuredClone(this.props.data.nodes);
    this.edges = structuredClone(this.props.data.edges);

    this.sim.nodes(this.nodes)
        .force("link", forceLink(this.edges).distance(10))
    this.startSimulation();
  }

  updateNodePositions(positions: readonly NodePosition[]) {
    for (const p of positions) {
      this.nodes[p.id].x = p.x;
      this.nodes[p.id].y = p.y;
    }
  }

  zoomToFit() {
    const bounds = this.marker.data().reduce((acc: Bounds, d: GraphNode) => ({
      left: Math.min(d.x, acc.left),
      right: Math.max(d.x, acc.right),
      bottom: Math.min(d.y, acc.bottom),
      top: Math.max(d.y, acc.top),
    }), {left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity});

    const bz = this.map.zoomAndCenterFromBounds(bounds, 0);
    this.map.center(bz.center);
    this.map.zoom(bz.zoom + Math.log2(0.8));
  }

  async screencap() {
    return await this.map.screenshot();
  }

  updateTooltipPositions() {
    this.marker.data().forEach((d: GraphNode) => {
      if (this.tooltips.hasOwnProperty(d.id)) {
        const tt = this.tooltips[d.id];
        tt.position({
          x: d.x,
          y: d.y,
        });
      }
    });
  }

  startSimulation() {
    if (this.forcesActive) {
      this.sim.alpha(0.3).restart();
    }
  }

  stopSimulation({ force = false }: { force: boolean }) {
    if (this.forcesActive || force) {
      this.sim.stop();
    }
  }

  render() {
    const mapStyle = {
      width: "100%",
      height: "calc(100vh - 64px)",
      padding: 0,
      margin: 0,
      overflow: "hidden",
    };

    return (
      <div ref={this.div} style={mapStyle} />
    );
  }
}

export default Graph;
