### 执行顺序

1. initProps
2. initMethods
3. initData
4. initComputed
5. initWatch  //watch是可以监听computed的
##### initProps的思路
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
##### iinitWatch的思路
