import './node_modules/geojs/geo.min.js';
import './node_modules/d3/dist/d3.min.js';

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

    const sim = d3.forceSimulation(nodes)
        .force('center', d3.forceCenter())
        .force('collide', d3.forceCollide().radius(3))
        .force('link', d3.forceLink(edges).distance(10))
        .force('charge', d3.forceManyBody().strength(-2))
        .on('tick', () => {
            point.data(nodes)
                .draw();

            line.data(edges)
                .line((item) => {
                    return [
                        [item.source.x, item.source.y],
                        [item.target.x, item.target.y],
                    ]
                })
                .draw();
        });

    sim.restart();
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
        strokeWidth: 1,
    });

const point = layer.createFeature("point")
    .style({
        strokeColor: "black",
        fillColor: (d) => d.hasOwnProperty('fx') ? "blue" : "red",
    })
    .geoOn(geo.event.feature.mouseclick, function (evt) {
        const data = evt.data;
        console.log(evt);

        if (data.hasOwnProperty('fx')) {
            delete data.fx;
            delete data.fy;
        } else {
            data.fx = data.x;
            data.fy = data.y;
        }

        this.modified();
        this.draw();
    })

visualizeNetwork(network, point, line);