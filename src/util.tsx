interface Node {
  id: number;
  fixed: boolean;
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
  degree: number;
}

type NodeTable = {
  [key: number]: Node;
}

interface Edge {
  source: number | Node;
  target: number | Node;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

async function fetchNetworkData(filename: string): Promise<string> {
  const resp = await fetch(`/data/${filename}`);
  return await resp.text();
}

function getNetwork(text: string): GraphData {
  let nodes: NodeTable = {};
  let edges: Edge[] = [];

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

export type { GraphData, Node, Edge };
export { fetchNetworkData, getNetwork };
