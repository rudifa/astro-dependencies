#! /usr/bin/env node

import path, {join} from "path";
import {exit} from "process";
import fs from "fs/promises";
import minimist from "minimist"; // for argument parsing
import {analyzeDependencies} from "./utils/deps-get.js";

import {
  dependenciesToDot,
  dependenciesToDotClusters,
  dotToSvg,
} from "./utils/deps-dotsvg.js";

async function checkDirectory(dir) {
  try {
    await fs.access(dir);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        `Directory ${dir} does not exist. Is this the root of an Astro project?`
      );
      exit(1);
    } else {
      throw error;
    }
  }
}

async function writeFile(filePath, string) {
  await fs.writeFile(filePath, string, "utf-8");
  console.log(`Created file ${filePath} (${string.length} bytes)`);
}

async function getDependencies(srcDir, useClusters, outPath) {
  try {
    // Analyze the dependencies in the source directory
    const dependencies = await analyzeDependencies(srcDir);

    // Convert the dependencies to DOT format, using clusters if specified
    const dot = useClusters
      ? dependenciesToDotClusters(dependencies)
      : dependenciesToDot(dependencies);

    // Convert the DOT format to SVG format
    const svg = await dotToSvg(dot);

    // Use the specified output path or default to the current directory
    const outputPath = outPath || ".";

    // Ensure the output directory exists, creating it if necessary
    await fs.mkdir(outputPath, {recursive: true});

    // Write the dependencies to a JSON file in the output directory
    await writeFile(
      `${outputPath}/dependencies.json`,
      JSON.stringify(dependencies, null, 2)
    );

    // Write the DOT representation of the dependencies to a file
    await writeFile(`${outputPath}/dependencies.dot`, dot);

    // Write the SVG representation of the dependencies to a file
    await writeFile(`${outputPath}/dependencies.svg`, svg);
  } catch (error) {
    // Log any errors that occur during the process
    console.error("Error getting dependencies:", error);
  }
}

function usage() {
  const scriptName = process.argv[1].split("/").pop();
  console.log(`Usage: ${scriptName} [options]

Generate a graph of the dependencies between astro files in a project.

Options:
    -c, --clusters  Use clusters in the output graph
    -o, --outpath   Output directory for the generated files
    -h, --help      Show this help message`);
}

// Main script code

// Parse command-line arguments
const args = minimist(process.argv.slice(2));
const useClusters = args.c || args.clusters;
const outPath = args.o || args.outpath;
const help = args.h || args.help;

if (help) {
  usage();
  process.exit(0);
}

const srcDir = "src";
checkDirectory(srcDir);
getDependencies(srcDir, useClusters, outPath);
