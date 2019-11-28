
# vue 对单文件的处理

## parse
```typescript
export function parse(
  source: string,
  {
    needMap = true,
    filename = 'component.vue',
    sourceRoot = ''
  }
){
  // .vue文件进行读取转为AST
  const ast = baseParse(source, {
      isNativeTag: () => true,
      getTextMode: () => TextModes.RAWTEXT
    })
  // 将AST拆解为sfc,用于后对script，dom，css单独处理
  const sfc = {
      filename,
      template: null,
      script: null,
      styles: [],
      customBlocks: []
  }
  ast.children.forEach(node => {
      if (node.type !== NodeTypes.ELEMENT) {
        return
      }
      if (!node.children.length) {
        return
      }
      switch (node.tag) {
        case 'template':
          if (!sfc.template) {
            sfc.template = createBlock(node) as SFCTemplateBlock
          } else {
            warnDuplicateBlock(source, filename, node)
          }
          break
        case 'script':
          if (!sfc.script) {
            sfc.script = createBlock(node) as SFCScriptBlock
          } else {
            warnDuplicateBlock(source, filename, node)
          }
          break
        case 'style':
          sfc.styles.push(createBlock(node) as SFCStyleBlock)
          break
        default:
          sfc.customBlocks.push(createBlock(node))
          break
      }
    })
    
}

```
未完待更新

## createBlock 方法

## baseParse方法是