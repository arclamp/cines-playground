interface GraphProps {
  nodeColor: string,
  edgeColor: string,
};

function Graph({ nodeColor, edgeColor }: GraphProps) {
  return (
    <div>
      <h1>Graph</h1>
      <h2 style={{color: nodeColor}}>Node Color: {nodeColor}</h2>
      <h2 style={{color: edgeColor}}>Edge Color: {edgeColor}</h2>
    </div>
  );
}

export default Graph;
