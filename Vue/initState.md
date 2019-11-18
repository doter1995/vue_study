### 执行顺序

1. initProps
2. initMethods
3. initData
4. initComputed
5. initWatch  //watch是可以监听computed的
##### initProps的思路
```javascript
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {};
  const props = (vm._props = {});
  
  const keys = (vm.$options._propKeys = []);
  const isRoot = !vm.$parent;
  if (!isRoot) {
    // 关闭Observing
    toggleObserving (false);
  }
  for (const key in propsOptions) {
    keys.push (key);
    const value = validateProp (key, propsOptions, propsData, vm);
    // 对将props的key处理为响应式
    defineReactive (props, key, value);
    // 如果key不在vm中，则将key代理到vm的_props下
    if (!(key in vm)) {
      proxy (vm, `_props`, key);
    }
  }
  toggleObserving (true);
}
```
##### initMethods的思路
##### initData的思路
1. 取出data值
```javascript
data = vm._data = typeof data === 'function' ? getData (data, vm) : data || {};
if (!isPlainObject (data)) {
    data = {};
    process.env.NODE_ENV !== 'production' 
        && warn ('data functions should return an object:\n' +
            'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',vm);
}
```
2. 将data值代理到实例上
```javascript
  // 将data代理到实例的_data上
  const keys = Object.keys (data);
  const props = vm.$options.props;
  const methods = vm.$options.methods;
  let i = keys.length;
  //遍历data的key
  while (i--) {
    const key = keys[i];
    //警告校验，data中的key是否在methods,props中已经存在
    ...
    // 如果发现props中已经存在,则不会对其代理到_data
    if (props && hasOwn (props, key)) {
     ...
    } else if (!isReserved (key)) {
      // 将data中某个值代理到vm._data上
      proxy (vm, `_data`, key);
    }
  }
```
3. 对data值进行监听(重点来了)
```javascript
  // 监听data
  observe (data, true /* asRootData */);
```
以下为observe的分析
```javascript
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 对非Object或为VNode的实例忽略
  ...
  // 重点在这里
  ob = new Observer (value);
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob;
}
```
剩下的逻辑请参考[Observer.md](/Vue/Observer.md)
##### initComputed的思路
```javascript

export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 当服务端渲染时，不需要Cache
  const shouldCache = !isServerRendering ();
  if (typeof userDef === 'function') {
    // computed传如的是方法,则没有set方法
    // 如果cache的话,
    // 否则直接返回调用userDef的方法来计算结果
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter (key)
      : createGetterInvoker (userDef);
    sharedPropertyDefinition.set = noop;
  } else {
    // 否则其set方法为默认值
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
          ? createComputedGetter (key)
          : createGetterInvoker (userDef.get)
      : noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }
  //将其computed的key代理到vm中。
  Object.defineProperty (target, key, sharedPropertyDefinition);
}

```
```javascript
// 创建conputedGetter的方法
// 这个方法，会将watcher和计算值时触发依赖进行关联
function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        // 立即取值
        watcher.evaluate ();
      }
      if (Dep.target) {
        // 将该watcher的dep都挂载上watcher
        watcher.depend ();
      }
      return watcher.value;
    }
  };
}
```
##### iinitWatch的思路
[参考demo](test_demo/observer/test.html)

```javascript
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key];
    //watch 的handle可以是一个数组
    if (Array.isArray (handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher (vm, key, handler[i]);
      }
    } else {
      createWatcher (vm, key, handler);
    }
  }
}
```
