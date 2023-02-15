import cy from "cytoscape";

import type { Node } from './util';
import type { LayoutOptions } from 'cytoscape';

export const layouts = ["random", "grid", "circle", "concentric", "breadthfirst", "cose"] as const;
type Layout = typeof layouts[number];

interface Position {
  x: number;
  y: number;
}

function pos_mean(data: Position[]): Position {
  const adder = (acc: number, x: number): number => acc + x;
  const length = data.length;

  return {
    x: data.map((d) => d.x).reduce(adder, 0) / length,
    y: data.map((d) => d.y).reduce(adder, 0) / length,
  };
}

export function isLayout(s: string): s is Layout {
  return (layouts as readonly string[]).includes(s);
}

export function cytoscapeLayout(nodes: Node[], layout: Layout) {
  // Run a cytoscape layout.
  const c = cy({
    elements: nodes.map((n) => ({
      group: "nodes",
      data: {
        id: `${n.id}`,
      },
    })),
  });

  const l = c.layout({
    name: layout,
  });
  l.run();

  // Pull the laid-out positions out into an array. (Even though the cytoscape
  // docs claim that the nodes collection can be subjected to iteration, etc.,
  // the published types don't actually allow it, so we have to jump through
  // this hoop).
  let cy_pos: { id: string, x: number, y: number }[] = [];
  for (let i=0; i < c.nodes().length; i += 1) {
    const n = c.nodes()[i];
    const p = n.position();
    cy_pos[i] = {
      id: n.id(),
      x: p.x,
      y: p.y,
    }
  }

  // Calculate the mean of the node positions, pre- and post-layout.
  const node_mean = pos_mean(nodes);
  const cy_mean = pos_mean(cy_pos);

  // Transcribe the laid-out positions, maintaining the original mean position.
  let map: {[n: number]: {x: number, y: number}} = {};
  for (const p of cy_pos) {
    map[+p.id] = {
      x: p.x - cy_mean.x + node_mean.x,
      y: p.y - cy_mean.y + node_mean.y,
    };
  }
  return map;
}
