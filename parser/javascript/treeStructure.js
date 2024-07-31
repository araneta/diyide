const fs = require("fs");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const filePath = process.argv[2];
const code = fs.readFileSync(filePath, "utf-8");

const ast = babelParser.parse(code, {
  sourceType: "module",
  plugins: ["jsx", "classProperties"]
});

const treeStructure = {
  classes: [],
  functions: [],
  variables: []
};
function getObjectProperties(node) {
  const properties = [];
  node.properties.forEach(prop => {
    if (prop.key && prop.value) {
      if (prop.value.type === "ObjectExpression") {
        properties.push({
          name: prop.key.name || prop.key.value,
          type: "object",
          startLine: prop.loc.start.line,
          properties: getObjectProperties(prop.value)
        });
      } else {
        properties.push({
          name: prop.key.name || prop.key.value,
          type: prop.value.type,
          startLine: prop.loc.start.line
        });
      }
    }
  });
  return properties;
}

traverse(ast, {
  enter(path) {
    if (path.isClassDeclaration()) {
      const classInfo = {
        name: path.node.id.name,
        methods: [],
        fields: []
      };
      path.traverse({
        ClassMethod(classMethodPath) {
          classInfo.methods.push({
            name: classMethodPath.node.key.name,
            type: classMethodPath.node.kind,
            startLine: classMethodPath.node.loc.start.line
          });
        },
        ClassProperty(classPropertyPath) {
          if (classPropertyPath.node.value.type === "ObjectExpression") {
            classInfo.fields.push({
              name: classPropertyPath.node.key.name,
              type: 'object',
              startLine: classPropertyPath.node.loc.start.line,
              properties: getObjectProperties(classPropertyPath.node.value)
            });
          } else {
            classInfo.fields.push({
              name: classPropertyPath.node.key.name,
              type: 'field',
              startLine: classPropertyPath.node.loc.start.line
            });
          }
        }
      });
      treeStructure.classes.push(classInfo);
    } else if (path.isFunctionDeclaration()) {
      treeStructure.functions.push({
        name: path.node.id.name,
        startLine: path.node.loc.start.line
      });
    } else if (path.isVariableDeclaration()) {
      path.node.declarations.forEach(declaration => {
        if (declaration.id.type === "Identifier") {
          treeStructure.variables.push({
            name: declaration.id.name,
            startLine: declaration.loc.start.line
          });
        } else if (declaration.init && declaration.init.type === "ArrowFunctionExpression") {
          treeStructure.functions.push({
            name: declaration.id.name,
            type: 'arrow',
            startLine: declaration.loc.start.line
          });
        }
      });
    }
  }
});

console.log(JSON.stringify(treeStructure, null, 2));
