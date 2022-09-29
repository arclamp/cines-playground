interface GraphProps {
  nodeColor: string,
  edgeColor: string,
  layout: string,
};

function Graph({ nodeColor, edgeColor, layout }: GraphProps) {
  return (
    <div>
      <h1>Graph</h1>
      <h2 style={{color: nodeColor}}>Node Color: {nodeColor}</h2>
      <h2 style={{color: edgeColor}}>Edge Color: {edgeColor}</h2>
      <h2>Layout: {layout}</h2>
    </div>
  );
}

export default Graph;
