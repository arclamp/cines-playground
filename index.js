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

function computeNodeTable(nodes) {
    let table = {};
    for (let node of nodes) {
        table[node.id] = node;
    }
    return table;
}

function visualizeNetwork(network, point, line) {
    const nodes = network.nodes;
    const edges = network.edges;

    const nodeTable = computeNodeTable(nodes);

    // Assign random positions to all nodes.
    const randCoord = (max) => (Math.random() * 2 * max) - max;
    for (let node of nodes) {
        node.position = {
            x: randCoord(300),
            y: randCoord(300),
        };
    }

    // Display the nodes.
    point.data(nodes.map((n) => n.position))
        .draw();

    // Display the edges.
    const lineData = edges.map((e) => [
        nodeTable[e.source].position,
        nodeTable[e.target].position,
    ]);
    line.data(lineData)
        .draw();
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

const line = layer.createFeature("line")
    .style({
        strokeColor: "blue",
        strokeWidth: 2,
    });

const point = layer.createFeature("point")
    .style({
        strokeColor: "black",
        fillColor: "red",
    });

visualizeNetwork(network, point, line);