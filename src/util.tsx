interface GraphNode {
  id: number;
  degree: number;
  fixed: boolean;

  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
}

interface GraphEdge {
  source: number | GraphNode;
  target: number | GraphNode;
}

type NodeTable = {
  [key: number]: GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

async function fetchNetworkData(filename: string): Promise<string> {
  const resp = await fetch(`/data/${filename}`);
  return await resp.text();
}

function getNetwork(text: string): GraphData {
  let nodes: NodeTable = {};
  let edges: GraphEdge[] = [];

  const addNode = (id: number): void => {
    if (!nodes.hasOwnProperty(id)) {
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

  for (let line of text.split("\n")) {
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

export type { GraphData, GraphNode, GraphEdge };
export { fetchNetworkData, getNetwork };
