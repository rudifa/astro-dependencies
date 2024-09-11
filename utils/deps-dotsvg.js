import path from "path";
import {instance} from "@viz-js/viz";
import graphviz from "graphviz";

function sanitizeName(name) {
  return name.replace(/[-@]/g, "_");
}

// dependenciesToDot converts a dependencies object to a DOT format string.
export function dependenciesToDot(dependencies) {
  // Create a new directed graph named "G"
  const g = graphviz.digraph("G");

  // Set the graph orientation to horizontal (left to right)
  g.set("rankdir", "LR");

  // Iterate over each file in the dependencies object
  Object.keys(dependencies).forEach((file) => {
    // Add a node for the current file
    const node = g.addNode(file);

    // Iterate over each dependency of the current file
    dependencies[file].forEach((dep) => {
      // Add an edge from the current file's node to the dependency's node
      g.addEdge(node, g.addNode(dep));
    });
  });

  // Return the DOT format string of the graph
  return g.to_dot();
}

// dependenciesToDotClusters converts a dependencies object to a DOT format string with clusters.
export function dependenciesToDotClusters(dependencies) {
  // Create a new directed graph named "G"
  const g = graphviz.digraph("G");

  // Set the graph orientation to horizontal (left to right)
  g.set("rankdir", "LR");

  // Object to keep track of clusters
  const clusters = {};

  // Create nodes and organize them into clusters
  Object.keys(dependencies).forEach((file) => {
    // Split the file path into parts
    const parts = file.split(path.sep);
    // Extract the top-level directory (first part of the path)
    const topLevelDir = parts[0];
    // Extract the file name from the parts
    const fileName = parts.pop();
    // Start with the main graph as the current cluster
    let currentCluster = g;

    // Create a cluster for the top-level directory if it doesn't exist
    const clusterName = `cluster_${sanitizeName(topLevelDir)}`;
    if (!clusters[clusterName]) {
      clusters[clusterName] = currentCluster.addCluster(clusterName);
      // Set the label of the cluster to the top-level directory name
      clusters[clusterName].set("label", topLevelDir);
    }
    // Update the current cluster to the top-level directory cluster
    currentCluster = clusters[clusterName];

    // Sanitize the file name to create a node name
    const nodeName = sanitizeName(file);
    // Add a node for the current file in the current cluster
    const node = currentCluster.addNode(nodeName);

    // Iterate over each dependency of the current file
    dependencies[file].forEach((dep) => {
      // Split the dependency path into parts
      const depParts = dep.split(path.sep);
      // Extract the top-level directory of the dependency
      const depTopLevelDir = depParts[0];
      // Extract the dependency file name from the parts
      const depFileName = depParts.pop();
      // Start with the main graph as the dependency cluster
      let depCluster = g;

      // Create a cluster for the dependency's top-level directory if it doesn't exist
      const depClusterName = `cluster_${sanitizeName(depTopLevelDir)}`;
      if (!clusters[depClusterName]) {
        clusters[depClusterName] = depCluster.addCluster(depClusterName);
        // Set the label of the cluster to the top-level directory name
        clusters[depClusterName].set("label", depTopLevelDir);
      }
      // Update the dependency cluster to the top-level directory cluster
      depCluster = clusters[depClusterName];

      // Sanitize the dependency file name to create a node name
      const depNodeName = sanitizeName(dep);
      // Add a node for the dependency in the dependency cluster
      const depNode = depCluster.addNode(depNodeName);
      // Add an edge from the current file's node to the dependency's node
      g.addEdge(node, depNode);
    });
  });

  // Generate the DOT format string of the graph
  const dotOutput = g.to_dot();
  // Return the DOT format string
  return dotOutput;
}

// dotToSvg converts a DOT string to a SVG string.
export async function dotToSvg(dotString) {
  try {
    // Wait for the viz instance to be ready
    const viz = await instance();

    // Render the DOT string to SVG
    const result = viz.render(dotString, {format: "svg"});

    // Return the SVG string
    return result.output;
  } catch (error) {
    console.error("Error converting DOT to SVG:", error);
    throw error;
  }
}
