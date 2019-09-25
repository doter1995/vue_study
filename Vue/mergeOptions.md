### mergeOptions 的处理思路

在组件初始化时需要对options进行处理
`VueCore/core/instance/init.js`
```javascript
if (options && options._isComponent) {
    // 处理内部组件，需要特殊处理
    initInternalComponent (vm, options);
} else {
    // 将继承的options，以及extends，mixins的option及配置options进行合并。
    vm.$options = mergeOptions (
    resolveConstructorOptions (vm.constructor),
    options || {},
    vm
    );
}
```
对于options处理两种情况：

### 1.当options存在且_isComponent是true时：
调用`initInternalComponent`
其思路是：
1. 取到`$vm.constructor.options`(默认的options)
2. 将传入的options特定属性与默认的options合并
```javascript
export function initInternalComponent (
  vm: Component,
  options: InternalComponentOptions
) {
  //此处创建一个空对象，其属性链挂载了vm.constructor.options，相当于提供了默认的属性。
  const opts = (vm.$options = Object.create (vm.constructor.options));
  // 先将option中的parent和_parentVnode
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;
  // 从父组件的拿到propsData以及listeners，listeners，tag
  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;
  // options如果有render,配置了则直接赋值
  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}
```
ps: 此处直接merge属性。不需要递归merge继承过来的属性。算是一个优化处理。

### 1.2.options不存在或者_isComponent为false时
两步操作：
1. 先处理constructor中的options
2. 将constructor中的options与传入的option或{}(即options为传入时)合并

#### 1.2.1处理constructor中的options
```javascript
// 处理组件及其继承的组件的options合并
// 理解为取出merge过其继承组件的options
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions (Ctor.super);
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option发生过变化,
      // 则需要处理新的options.
      Ctor.superOptions = superOptions;
      // 此处获取Ctor修改过的opetions
      const modifiedOptions = resolveModifiedOptions (Ctor);
      // 将修改过的属性加入到extendOptions
      if (modifiedOptions) {
        extend (Ctor.extendOptions, modifiedOptions);
      }
      // 合并superOptions和Ctor.extendOptions，并赋值给options
      options = Ctor.options = mergeOptions (superOptions, Ctor.extendOptions);
      //如果options的name存在
      if (options.name) {
        //为options中components添加自身组件
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}
// 取出修改过的options，新生成对象
function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified;
  const latest = Ctor.options;
  // sealed 密封
  // sealedOptions即密封的option。是不可扩展的。
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
```
根据上面代码分析：
1. 根据传入constructor，取出其options。
2. 判断constructor是否有super，如果没有直接返回其options。

3. 如果存在，继续递归super的获取其superOptions。
4. 将获取的superOptions，与其constructor.superOptions对比，如果一致不做处理
5. 如果不一致，先提取通过resolveModifiedOptions，提取修改的options属性。
6. 将Ctor.extendOptions与修改过的options项进行extend
7. 将获取到的superOptions与Ctor.extendOptions进行递归调用mergeOption操作。
8. 如果option拥有name属性，则将其添加到components。

ps: 由于以上递归过多，可以简单理解为：通过递归获取继承的组件options进行合并。并将其拥有name属性组件添加到components中

#### 1.2.2 mergeOptions
[options.js](/VueCore/core/util/options.js)
合并两个options，即parent,child

1. 将child的props统一处理为Object形式
2. 将child的inject统一处理为Object形式
3. 将child的directives统一处理为object形式

4. 如果child._base不为true
5. 将child中配置的extends中的options merge到parent中。
6. 将child中配置的mixins中的options merge到parent中。

7. 遍历parent属性与child合并到`新的options`。
8. 遍历chuild属性独有属性，parent与child合并`options`。
这样合并出来的是新的对象。

##### 1.2.2.1 关于属性合并规则
1. props,methods,inject,computed的处理思路:
判断parentVal不存在，直接返回childVal
否则copy一份parentVal。
然后将childVal的属性merge进去。
```javascript
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}
```
2. watch 由于parent和child可能同时监听一个，所以需要将监听函数合并为数组
```javascript
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    // ret[key]进行数组合并，或转为数组
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}
```
3. data合并，会将data方法执行，并对其方法返回值进行`深merge`
```javascript
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      //此处移除源码警告信息
      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }
  return mergeDataOrFn(parentVal, childVal, vm)
}
```
4. provide 的合并mergeDataOrFn
 
 mergeDataOrFn时，会判断parentVal，和childVal是否为function，
 如果是function则取到该方法返回值进行`mergeData`。

5. mergeData 会对其进行`深merge`,注意其实是返回一个方法，这个方法会进行`深merge`，两个data的返回值。
```javascript
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      //判断其属性值为Object，则进行深merge
      mergeData(toVal, fromVal)
    }
  }
  return to
}
```
6. LIFECYCLE_HOOKS的合并
```javascript
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
]
//都会使用`mergeHook`来合并
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  // 将parentVal和childVal数组惊醒合并。
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res) //会进行去重
    : res
}
```
9. ASSET_TYPES 合并
```javascript
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    // 浅merge
    return extend(res, childVal)
  } else {
    return res
  }
}
```

好了mergeOption就完了，简单理解就是：

对与data和provide。合并出一个function，这个函数返回的是两个function的返回值的merge结果。并且merge结果时使用的是递归`深merge`
对于其他的进行`浅merge`，部分需要数组的需要对方法进行merge

参考[options.js](VueCore/core/util/options.js)
