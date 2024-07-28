const fs = require("fs");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const filePath = process.argv[2];
const code = fs.readFileSync(filePath, "utf-8");

const ast = babelParser.parse(code, {
  sourceType: "module",
  plugins: ["jsx", "typescript"]
});

const elements = [];
let currentClass = null;

function addElement(name, startLine, startColumn, endLine, endColumn) {
  elements.push({ name, startLine, startColumn, endLine, endColumn });
}

traverse(ast, {
  ClassDeclaration(path) {
    const name = path.node.id.name;
    const { start, end } = path.node.loc;
    addElement(name, start.line, start.column, end.line, end.column);

    currentClass = name;
    path.traverse({
      ClassMethod(classMethodPath) {
        const methodName = `${currentClass}.${classMethodPath.node.key.name}`;
        const { start, end } = classMethodPath.node.loc;
        addElement(methodName, start.line, start.column, end.line, end.column);
      }
    });
    currentClass = null;
  },
  FunctionDeclaration(path) {
    const name = path.node.id.name;
    const { start, end } = path.node.loc;
    addElement(name, start.line, start.column, end.line, end.column);
  },
  FunctionExpression(path) {
    const name = path.parent.id ? path.parent.id.name : (path.parent.key ? path.parent.key.name : "anonymous");
    const { start, end } = path.node.loc;
    addElement(name, start.line, start.column, end.line, end.column);
  },
  ArrowFunctionExpression(path) {
    const name = path.parent.id ? path.parent.id.name : (path.parent.key ? path.parent.key.name : "anonymous");
    const { start, end } = path.node.loc;
    addElement(name, start.line, start.column, end.line, end.column);
  },
  ObjectMethod(path) {
    const name = path.node.key.name;
    const { start, end } = path.node.loc;
    addElement(name, start.line, start.column, end.line, end.column);
  }
});

console.log(JSON.stringify(elements, null, 2));
