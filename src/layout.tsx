import cy from "cytoscape";

import type { Node } from './util';

const layouts = ["null", "grid", "circle"] as const;
type Layout = typeof layouts[number];

export function isLayout(s: string): s is Layout {
  return (layouts as readonly string[]).includes(s);
}

export function cytoscapeLayout(nodes: Node[], layout: "null" | "grid" | "circle") {
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

  let map: {[n: number]: {x: number, y: number}} = {};
  for (let i=0; i<c.nodes().length; i += 1) {
    const n = c.nodes()[i];
    map[+n.data("id")] = n.position();
  }
  return map;
}
