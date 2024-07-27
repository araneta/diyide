const fs = require("fs");
const babelParser = require("@babel/parser");

const filePath = process.argv[2];

const code = fs.readFileSync(filePath, "utf-8");

const ast = babelParser.parse(code, {
  sourceType: "module",
  plugins: ["jsx", "typescript"]
});

const functions = [];

function traverse(node) {
  if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    functions.push({
      name: node.id ? node.id.name : "anonymous",
      line: node.loc.start.line
    });
  }
  for (const key in node) {
    if (node[key] && typeof node[key] === "object") {
      traverse(node[key]);
    }
  }
}

traverse(ast);

console.log(JSON.stringify(functions, null, 2));
