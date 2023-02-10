import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import geo from 'geojs';
import { forceSimulation, forceCenter, forceManyBody, forceCollide, forceLink, Simulation } from 'd3-force';
import { GraphData, Node, Edge } from './util';

import type { NodeDatum } from './util';
import type { SimulationNodeDatum } from 'd3-force';

interface GraphProps {
  graphData: GraphData;
  nodeColor: string;
  edgeColor: string;
  layout: string;
};

const dummyForce: Simulation<Node, Edge> = forceSimulation();

const Graph = forwardRef(function Graph({ graphData, nodeColor, edgeColor, layout }: GraphProps, ref) {
  const div = useRef<HTMLDivElement>(null);
  const map = useRef<GeojsMap | null>(null);
  const line = useRef<LineFeature | null>(null);
  const marker = useRef<MarkerFeature | null>(null);
  const uiLayer = useRef<any>(null);
  const nodes = useRef<Node[]>([]);
  const edges = useRef<Edge[]>([]);
  const sim = useRef<Simulation<Node, Edge>>(dummyForce);

  useImperativeHandle(ref, () => {
    return {
      zoomToFit() {
        let bounds = {
          left: Infinity,
          right: -Infinity,
          bottom: Infinity,
          top: -Infinity,
        };
        for (const d of marker.current!.data()) {
          if (d.x < bounds.left) {
            bounds.left = d.x;
          }
          if (d.x > bounds.right) {
            bounds.right = d.x;
          }
          if (d.y < bounds.bottom) {
            bounds.bottom = d.y;
          }
          if (d.y > bounds.top) {
            bounds.top = d.y;
          }
        }

        /// @ts-ignore
        const bz = map.current!.zoomAndCenterFromBounds(bounds, 0);

        /// @ts-ignore
        map.current!.center(bz.center);

        /// @ts-ignore
        map.current!.zoom(bz.zoom + Math.log2(0.8));
      },

      async screencap() {
        /// @ts-ignore
        const imageURL = await map.current!.screenshot();

        const link = document.createElement("a");
        link.href = imageURL;
        link.download = "graph.png";
        link.click();
      },
    };
  });

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

    uiLayer.current = map.current.createLayer("ui", {
      zIndex: 2,
    });

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
        radius: (d) => Math.sqrt(d.degree),
        strokeWidth: 0.05,
      });

    const tooltips: {[index: number]: any} = {};
    marker.current!.geoOn(geo.event.feature.mouseclick, function (evt) {
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
        sim.current.alpha(0.3)
            .restart();
      } else {
        // Toggle the display of the node label.
        if (tooltips.hasOwnProperty(data.id)) {
          uiLayer.current!.deleteWidget(tooltips[data.id]);
          delete tooltips[data.id]
        } else {
          tooltips[data.id] = uiLayer.current!.createWidget("dom", {
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
    marker.current!.geoOn(geo.event.feature.mouseon, function (evt) {
      node = evt.data;
      startPos = {
        x: node!.x,
        y: node!.y,
      };
      map.current!.interactor().addAction({
        action: "dragnode",
        name: "myaction",
        owner: "me",
        input: "left",
      });
    }).geoOn(geo.event.actionmove, function (evt: any) {
      node!.fx = startPos.x + evt.mouse.geo.x - evt.state.origin.geo.x;
      node!.fy = startPos.y + evt.mouse.geo.y - evt.state.origin.geo.y;

      if (tooltips.hasOwnProperty(node!.id)) {
        const tt = tooltips[node!.id];
        tt.position({
          x: node!.fx,
          y: node!.fy,
        });
      }

      marker.current!.dataTime().modified();
      marker.current!.draw();

      line.current!.dataTime().modified();
      line.current!.draw();

      sim.current.alpha(0.3).restart();
    }).geoOn(geo.event.actionup, function (evt: any) {
      if (!node!.fixed) {
        node!.fx = node!.fy = null;
      }

      map.current!.interactor().removeAction(undefined, undefined, "me");
    });

    function isNodeDatum(d: SimulationNodeDatum): d is NodeDatum {
      return d.hasOwnProperty("degree");
    }

    sim.current = forceSimulation(nodes.current)
      .force("center", forceCenter())
      .force("collide", forceCollide().radius((d: SimulationNodeDatum) => {
        return isNodeDatum(d) ? Math.sqrt(d.degree) : 10;
      }))
      .force("link", forceLink(edges.current).distance(5))
      .force("charge", forceManyBody().strength(-2))
      .on("tick", () => {
        marker.current!.data(nodes.current).draw();
        line.current!.data(edges.current).draw();

        marker.current!.data().forEach((d: Node) => {
          if (tooltips.hasOwnProperty(d.id)) {
            const tt = tooltips[d.id];
            tt.position({
              x: d.x,
              y: d.y,
            });
          }
        });
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
});

export default Graph;
