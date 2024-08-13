const fs = require("fs");
const path = require("path");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function resolveFilePath(filePath) {
  if (fileExists(filePath)) {
    return filePath;
  }
  const jsFilePath = `${filePath}.js`;
  if (fileExists(jsFilePath)) {
    return jsFilePath;
  }
  return null;
}

function parseImports(filePath) {
  const resolvedPath = resolveFilePath(filePath);
  if (!resolvedPath) {
    //console.error(`File does not exist: ${filePath}`);
    return [];
  }

  const code = fs.readFileSync(resolvedPath, "utf-8");
  const ast = babelParser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"]
  });

  const imports = [];

  traverse(ast, {
    ImportDeclaration({ node }) {
      const importPath = node.source.value;
      imports.push(importPath);
    }
  });

  return imports;
}

function resolveImport(filePath, importPath) {
  if (importPath.startsWith(".")) {
    const resolvedPath = resolveFilePath(path.resolve(path.dirname(filePath), importPath));
    if (resolvedPath) {
      return resolvedPath;
    }
  }
  // Handle non-relative imports (e.g., from node_modules)
  return null; // or handle appropriately
}

function recursivelyIndexImports(filePath, visited = new Set()) {
  const resolvedPath = resolveFilePath(filePath);
  if (!resolvedPath) {
    // console.error(`File does not exist: ${filePath}`);
    return [];
  }

  if (visited.has(resolvedPath)) {
    return [];
  }
  visited.add(resolvedPath);

  let imports = [];
  try {
    imports = parseImports(resolvedPath);
  } catch (error) {
    console.error(`Error parsing imports in file: ${resolvedPath}`, error);
    return [];
  }

  let resolvedImports = [];
  try {
    resolvedImports = imports.map(importPath => resolveImport(resolvedPath, importPath)).filter(Boolean);
  } catch (error) {
    console.error(`Error resolving imports in file: ${resolvedPath}`, error);
    return [];
  }

  let allImports = [resolvedPath];
  for (const importFilePath of resolvedImports) {
    try {
      allImports = allImports.concat(recursivelyIndexImports(importFilePath, visited));
    } catch (error) {
      console.error(`Error indexing imports recursively for file: ${importFilePath}`, error);
    }
  }

  return allImports;
}


const filePath = process.argv[2];
const allImports = recursivelyIndexImports(filePath);
console.log(JSON.stringify(allImports, null, 2));
