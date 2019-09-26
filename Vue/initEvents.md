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
简单来说就是：
将listeners挂载到dom中。
对oldListeners中listeners已不存在的进行移除。
```javascript
export function updateListeners (
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  createOnceHandler: Function,
  vm: Component
) {
  let name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    // 将event处理为统一格式
    event = normalizeEvent (name);
    /* istanbul ignore if */
    if (__WEEX__ && isPlainObject (def)) {
      cur = def.handler;
      event.params = def.params;
    }
    if (isUndef (cur)) {
      //如果cur不存在 在非生产环境报错
      process.env.NODE_ENV !== 'production' &&
        warn (
          `Invalid handler for event "${event.name}": got ` + String (cur),
          vm
        );
    } else if (isUndef (old)) {
      //cur存在 old不存在时

      if (isUndef (cur.fns)) {
        //如果是数组
        cur = on[name] = createFnInvoker (cur, vm);
      }
      if (isTrue (event.once)) {
        cur = on[name] = createOnceHandler (event.name, cur, event.capture);
      }
      // 将cur事件添加进去
      add (event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      // 将cur赋给old，更新了事件
      old.fns = cur;
      on[name] = old;
    }
  }
  // 移除old多余的事件
  for (name in oldOn) {
    if (isUndef (on[name])) {
      event = normalizeEvent (name);
      remove (event.name, oldOn[name], event.capture);
    }
  }
}
```
其中add，remove，createOnceHandler都比较简单
```javascript
function add (event, fn) {
  target.$on (event, fn);
}

function remove (event, fn) {
  target.$off (event, fn);
}

function createOnceHandler (event, fn) {
  const _target = target;
  return function onceHandler () {
    const res = fn.apply (null, arguments);
    if (res !== null) {
      _target.$off (event, onceHandler);
    }
  };
}
```
