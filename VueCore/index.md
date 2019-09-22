## Vue Core

#### instance vue
```javascript
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
//加入初始化函数
initMixin(Vue)
//加入state
stateMixin(Vue)
//加入事件
eventsMixin(Vue)
//加入生命周期
lifecycleMixin(Vue)
//加入render
renderMixin(Vue)

export default Vue
````
#### initMixin
初始化_init方法

#### stateMixin
`/src/core/instance/state.js`的`stateMixin`方法

初始化state方法:

1. 初始化$data的get返回{}
2. 初始化$props的get返回{}
3. 加入$set
4. 加入$delete
5. 加入$watch

#### eventsMixin
`/src/core/instance/events.js`的`eventsMixin`方法
1. 加入$on
2. 加入$once
3. 加入$off
4. 加入$emit

#### lifecycleMixin
`/src/core/instance/lifecycle.js`的`lifecycleMixin`方法
1. 加入_update方法
2. 加入$forceUpdate方法
3. 加入$destroy方法

#### renderMixin
`/src/core/instance/lifecycle.js`的`lifecycleMixin`方法
1. 加入render的辅助函数

```javascript
export function installRenderHelpers (target: any) {
  target._o = markOnce
  target._n = toNumber
  target._s = toString
  target._l = renderList
  target._t = renderSlot
  target._q = looseEqual
  target._i = looseIndexOf
  target._m = renderStatic
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode
  target._e = createEmptyVNode
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}
```
2. 加入$nextTick方法
3. 加入_render方法

### core index Vue
当上面的方法挂载完后
```javascript

initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})
```
##### initGlobalAPI
挂载全局的方法。
1. 加入config
2. 加入util对象
```javascript
 Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }
```
3. 加入set方法
4. 加入delete方法
5. 加入nextTick方法
6. 加入observable方法
7. 加入options
```javascript
Vue.options = Object.create(null)
// ASSET_TYPES=['component','directive','filter']
ASSET_TYPES.forEach(type => {
  Vue.options[type + 's'] = Object.create(null)
})
```
8. 加入options.components的KeepAlive

```javascript
initUse(Vue)
initMixin(Vue)
initExtend(Vue)
initAssetRegisters(Vue)
```
9. 加入use
10. 加入mixin
11. 加入extend
```javascript
// ASSET_TYPES=['component','directive','filter']
ASSET_TYPES.forEach(type => {
  Vue[type] = function (){...}
})
```
12. 加入component
13. 加入directive
14. 加入filter

15. 加入FunctionalRenderContext