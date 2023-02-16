import type { GraphNode, GraphEdge, GraphData } from './types';

async function fetchNetworkData(filename: string): Promise<string> {
  const resp = await fetch(`/data/${filename}`);
  return await resp.text();
}

function getNetwork(text: string): GraphData {
  const nodes: { [key: number]: GraphNode } = {};
  const edges: GraphEdge[] = [];

  const addNode = (id: number): void => {
    if (!Object.hasOwn(nodes, id)) {
      nodes[id] = {
        id,
        fixed: false,
        x: 0,
        y: 0,
        fx: null,
        fy: null,
        degree: 0,
      };
    }

    nodes[id].degree += 1;
  }

  for (const line of text.split("\n")) {
    if (line) {
      const [source, target] = line
        .split(" ")
        .map((x) => parseInt(x));

      // Add the nodes to the node list.
      addNode(source);
      addNode(target);

      // Add the edge between them.
      edges.push({
        source,
        target,
      });
    }
  }

  return {
    nodes: Object.values(nodes),
    edges,
  }
}

export { fetchNetworkData, getNetwork };
