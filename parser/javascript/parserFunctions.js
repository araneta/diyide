const fs = require("fs");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const filePath = process.argv[2];
const code = fs.readFileSync(filePath, "utf-8");

const ast = babelParser.parse(code, {
  sourceType: "module",
  plugins: ["jsx", "typescript"]
});

const functions = [];
let currentClass = null;

function addFunction(name, line) {
  functions.push({ name, line });
}

traverse(ast, {
  ClassDeclaration(path) {
    currentClass = path.node.id.name;
    path.traverse({
      ClassMethod(classMethodPath) {
        const methodName = classMethodPath.node.key.name;
        const line = classMethodPath.node.loc.start.line;
        addFunction(`${currentClass}.${methodName}`, line);
      }
    });
    currentClass = null;
  },
  FunctionDeclaration(path) {
    const name = path.node.id.name;
    const line = path.node.loc.start.line;
    addFunction(name, line);
  },
  FunctionExpression(path) {
    const name = path.parent.id ? path.parent.id.name : (path.parent.key ? path.parent.key.name : "anonymous");
    const line = path.node.loc.start.line;
    addFunction(name, line);
  },
  ArrowFunctionExpression(path) {
    const name = path.parent.id ? path.parent.id.name : (path.parent.key ? path.parent.key.name : "anonymous");
    const line = path.node.loc.start.line;
    addFunction(name, line);
  },
  ObjectMethod(path) {
    const name = path.node.key.name;
    const line = path.node.loc.start.line;
    addFunction(name, line);
  }
});

console.log(JSON.stringify(functions, null, 2));
