import './node_modules/geojs/geo.min.js';

async function getNetwork() {
    const resp = await fetch('network.dat');
    const text = await resp.text();

    let nodes = {};
    let edges = [];

    const addNode = (id) => {
        if (!nodes.hasOwnProperty(id)) {
            nodes[id] = {
                id,
            };
        }
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

const network = await getNetwork();
console.log(network);

const map = geo.map({
    node: "#map",
    center: {x: 0, y: 0},
    zoom: 0,
});

const layer = map.createLayer('feature', {
    features: ["point", "line"],
});

const pointData = [
    {x: 0, y: 0},
];

const point = layer.createFeature("point")
    .data(pointData)
    .style({
        strokeColor: "black",
        fillColor: "red",
    });

point.draw();

const lineData = [
    [{x: -50, y: 0}, {x: 30, y: 60}],
];

const line = layer.createFeature("line")
    .data(lineData)
    .style({
        strokeColor: "blue",
        strokeWidth: 2,
    });

line.draw();