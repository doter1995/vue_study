## initLifecycle

```javascript
export function initLifecycle (vm: Component) {
  const options = vm.$options;

  // 选取第一个非抽象父级
  let parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push (vm);
  }
  // 设置其父级，和root
  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;
  // 初始化$children为数组，$refs为object
  vm.$children = [];
  vm.$refs = {};
  // 设置内部变量为初始值
  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}
```