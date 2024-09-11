import fs from "fs/promises";
import path from "path";


// analyzeDependencies finds the dependencies between the astro project files.
export async function analyzeDependencies(srcDir) {

  const dependencies = {};

  async function processFile(filePath) {
    // Read the content of the file at the given filePath
    const content = await fs.readFile(filePath, "utf-8");

    // Use a regular expression to find all import statements in the file
    const imports = content.match(/import.*from\s+['"](.+)['"]/g) || [];

    // Get the relative path of the file from the root directory
    const relativeFilePath = path.relative(srcDir, filePath);

    // Map the import statements to their relative file paths
    dependencies[relativeFilePath] = imports
      .map((imp) => {
        // Extract the module path from the import statement
        const match = imp.match(/from\s+['"](.+)['"]/);
        return match
          ? path.relative(
              srcDir,
              path.resolve(path.dirname(filePath), match[1])
            )
          : null;
      })
      // Filter out any null values
      .filter(Boolean);
  }

  async function traverse(currentDir) {
    // Read the contents of the current directory
    const files = await fs.readdir(currentDir);

    // Iterate over each file/directory in the current directory
    for (const file of files) {
      // Construct the full path of the file/directory
      const filePath = path.join(currentDir, file);

      // Get the stats of the file/directory
      const stat = await fs.stat(filePath);

      // If it's a directory, recursively traverse it
      if (stat.isDirectory()) {
        await traverse(filePath);
      }
      // If it's a file with a .astro extension, process it
      else if (path.extname(filePath) === ".astro") {
        await processFile(filePath);
      }
    }
  }

  await traverse(srcDir);
  return dependencies;
}
