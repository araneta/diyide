const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

// Helper function to get the absolute path from an import source
function resolveImportPath(basePath, importSource) {
  return path.resolve(path.dirname(basePath), importSource);
}
function checkFileExistsSync(filepath){
  let flag = true;
  try{
    fs.accessSync(filepath, fs.constants.F_OK);
  }catch(e){
    flag = false;
  }
  return flag;
}

// Extract imports from a file
function extractImports(filePath) {
	if(!checkFileExistsSync(filePath)){
		console.log('missing ',filePath);
		return [];
	}
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(fileContent, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  const imports = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      imports.push({
        source,
        resolvedPath: resolveImportPath(filePath, source)
      });
    }
  });

  return imports;
}

// Recursively index imports
function indexImports(filePath, visited = new Set()) {
  if (visited.has(filePath)) return {};
  visited.add(filePath);

  const imports = extractImports(filePath);
  //console.log('imports',imports);
  const index = {};

  for (const { source, resolvedPath } of imports) {
    index[filePath] = index[filePath] || [];
    index[filePath].push(source);

    // Recurse into imported files
    const importedIndex = indexImports(resolvedPath, visited);
    for (const [importedFile, importedImports] of Object.entries(importedIndex)) {
      index[importedFile] = importedImports;
    }
  }

  return index;
}

// Entry point
const initialFilePath = process.argv[2]; // Adjust to your file path
const indexedImports = indexImports(initialFilePath);

console.log(JSON.stringify(indexedImports, null, 2));

