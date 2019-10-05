### initRender
1. 初始化_vnode和_staticTrees
```javascript
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
```
2. 初始化$vnode为_parentVnode，
```javascript
  const parentVnode = (vm.$vnode = options._parentVnode); // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context;
```
3. 初始化插槽slots
```javascipt
  vm.$slots = resolveSlots (options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
```
4. 初始化_c和$createElement
  // ToDo: _c和$createElement的区别
  vm._c = (a, b, c, d) => createElement (vm, a, b, c, d, false);
  vm.$createElement = (a, b, c, d) => createElement (vm, a, b, c, d, true);
5. 
```javascript
defineReactive (vm, '$attrs',(parentData &&  parentData.attrs) || emptyObject, null, true);
defineReactive (vm, '$listeners', options._parentListeners || emptyObject, null, true);
```