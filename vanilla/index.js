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
                fixed: false,
                fx: null,
                fy: null,
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

function visualizeNetwork(network, point, line) {
    const nodes = network.nodes;
    const edges = network.edges;

    const sim = d3.forceSimulation(nodes)
        .force('center', d3.forceCenter())
        .force('collide', d3.forceCollide().radius(3))
        .force('link', d3.forceLink(edges).distance(10))
        .force('charge', d3.forceManyBody().strength(-2))
        .on('tick', () => {
            point.data(nodes).draw();
            line.data(edges).draw();
        });

    let node = null;
    let startPos = null;

    
    point.geoOn(geo.event.feature.mouseclick, function (evt) {
        const data = evt.data;

        // Pin/unpin a node by setting/deleting its fx/fy properties.
        data.fixed = !data.fixed;
        if (data.fixed) {
            data.fx = data.x;
            data.fy = data.y;
        } else {
            data.fx = data.fy = null;
        }

        // Ask GeoJS to redraw the points.
        this.modified();
        this.draw();

        // Kick the simulation.
        sim.alpha(0.3)
            .restart();
    })
        .geoOn(geo.event.actionmove, function (evt) {
            node.fx = startPos.x + evt.mouse.geo.x - evt.state.origin.geo.x;
            node.fy = startPos.y + evt.mouse.geo.y - evt.state.origin.geo.y;

            point.dataTime().modified();
            point.draw();

            line.dataTime().modified();
            line.draw();

            sim.alpha(0.3).restart();
        })
        .geoOn(geo.event.feature.mouseon, function (evt) {
            node = evt.data;
            startPos = {
                x: node.x,
                y: node.y,
            };
            map.interactor().addAction({
                action: 'dragnode',
                name: 'myaction',
                owner: 'me',
                input: 'left'
            });
        })
        .geoOn(geo.event.actionup, function (evt) {
            if (!node.fixed) {
                node.fx = node.fy = null;
            }
            node = null;

            map.interactor().removeAction(undefined, undefined, 'me');
        })
        .geoOn(geo.event.feature.mouseover, function (evt) {
            const data = evt.data;

            tooltip.position({
                x: data.x,
                y: data.y,
            });
            tooltipElem.textContent = `${data.id}${data.fixed ? " (fixed)": ""}: (${data.x}, ${data.y})`;
            tooltipElem.classList.toggle("hidden");
        })
        .geoOn(geo.event.feature.mouseout, function (evt) {
            tooltipElem.classList.toggle("hidden");
        })

    sim.restart();
}

const network = await getNetwork();
console.log(network);

const map = geo.map({
    node: "#map",
    center: {x: 0, y: 0},
    zoom: 0,
    gcs: "+proj=longlat +axis=enu",
    ingcs: "+proj=longlat +axis=enu",
    maxBounds: {
        left: -100,
        right: 100,
        bottom: -100,
        top: 100,
    }
});

const layer = map.createLayer('feature', {
    features: ["marker", "line"],
});

const line = layer.createFeature("line")
    .line((item) => {
        return [
            [item.source.x, item.source.y],
            [item.target.x, item.target.y],
        ]
    })
    .style({
        strokeColor: "blue",
        strokeWidth: 1,
    });

const point = layer.createFeature("marker")
    .style({
        strokeColor: "black",
        fillColor: (d) => d.fixed ? "blue" : "red",
        scaleWithZoom: geo.markerFeature.scaleMode.all,
        radius: 2,
        strokeWidth: 0.05,
    });

const uiLayer = map.createLayer("ui", {
    zIndex: 2,
});
const tooltip = uiLayer.createWidget("dom", {
    position: {
        x: 0,
        y: 0,
    }
});
const tooltipElem = tooltip.canvas();
tooltipElem.classList.add("tooltip");
tooltipElem.classList.add("hidden");

visualizeNetwork(network, point, line);