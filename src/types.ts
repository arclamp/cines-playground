export interface GraphNode {
  id: number;
  degree: number;
  fixed: boolean;

  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
}

export interface GraphEdge {
  source: number | GraphNode;
  target: number | GraphNode;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}


