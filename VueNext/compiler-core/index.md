# Compiler Cor

## parse方法
```typescript
export function parse(content: string, options: ParserOptions = {}): RootNode {
  const context = createParserContext(content, options)
  const start = getCursor(context)

  return {
    type: NodeTypes.ROOT,
    children: parseChildren(context, TextModes.DATA, []),
    helpers: [],
    components: [],
    directives: [],
    hoists: [],
    cached: 0,
    codegenNode: undefined,
    loc: getSelection(context, start)
  }
}
```
### createParserContext
### getCursor
获取当前的Position
```typescript
function getCursor(context: ParserContext): Position {
  const { column, line, offset } = context
  return { column, line, offset }
}
```
### parseChildren
过滤掉一些非正常的dom
然后`parseElement`处理正常的标签
### parseElement