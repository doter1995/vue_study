### initEvents
初始化Event

```javascript
export function initEvents (vm: Component) {
  // 初始化_events和_hasHookEvent
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // 初始化其_parentListeners
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}
```
#### updateComponentListeners
将_parentListeners更新到其vm上
```javascript
export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  //此处target设置为vm，其add和remove会操作在该vm上
  target = vm
  //通过对比listeners上的进行挂载，对oldListeners独有的进行移除
  // 此处只有listeners，所以只是将_parentListeners挂载到vm上
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  //移除vm
  target = undefined
}
```
#### updateListeners
// todo：待加入