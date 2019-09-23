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
// ToDo:未完待续