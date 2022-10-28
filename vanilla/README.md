# cines-playground/vanilla
Playground / experimentation for CINES graph visualization work

## Build instructions

To build this application, first run `yarn install` to install the library
dependencies, then `python -m http.server 8000` to serve the application on port
8000. Point a web browser there and you should see the example graph dataset be
loaded.

## Features

The application loads a small example network. It lays out the graph dynamically
using `d3-force`, and you can click on individual nodes to "pin" them in place
(they will no longer be subject to the simulated forces involved in the dynamic
layout). Clicking again will "unpin" the node.
