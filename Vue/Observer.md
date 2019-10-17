### vue的Observer实现监听思路

> 接着data的思路

### new Observer(value)做了什么
```javascript
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value;
    //初始化dep();
    this.dep = new Dep ();
    this.vmCount = 0;
    def (value, '__ob__', this);
    if (Array.isArray (value)) {
      if (hasProto) {
        protoAugment (value, arrayMethods);
      } else {
        copyAugment (value, arrayMethods, arrayKeys);
      }
      this.observeArray (value);
    } else {
      this.walk (value);
    }
  }
  walk (obj: Object) {
    const keys = Object.keys (obj);
    for (let i = 0; i < keys.length; i++) {
      // 重点在这里，将会对obj的key遍历设置其geter,seter
      defineReactive (obj, keys[i]);
    }
  }
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe (items[i]);
    }
  }
}
```
defineReactive做了什么？
```javascript
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep ();
  val = val ｜｜ obj[key];
  ...
  // 此处observe(val)对递归到子属性
  let childOb = !shallow && observe (val);
  // 重新定义defineProperty
  Object.defineProperty (obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call (obj) : val;
      // 此处Dep.target在哪里赋值呢？
      // Dep.target只有在初始化watch和render的时候赋值。
      // render的时候需要取值，这样就将dep和traget进行关联起来了。
      if (Dep.target) {
        dep.depend ();
        if (childOb) {
          //此处为重点
          childOb.dep.depend ();
          if (Array.isArray (value)) {
            dependArray (value);
          }
        }
      }
      return value;
    },
    set: function reactiveSetter (newVal) {
      // 对其新的值进行递归监听
      childOb = !shallow && observe (newVal);
      // 此处将会通知dep下所有的watcher.update从而实现更新
      dep.notify ();
    },
  });
}
```
接下来继续看看dep.depend()干了什么
```javascript
let uid = 0
Dep.target = null
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }
  //depend将会回调这里，将watcher加入到subs
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    // 此处会判断Dep.target，从而决定是否加入
    // 思考为什么需要判断呢？
    // 当组件在某些生命周期中不需要为其添加dep呢？只需要将Dep.target设置为null即可
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

```
addDep做了什么？
```javascript
 /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        // 重点这里又回调到Dep了
        dep.addSub(this)
      }
    }
  }
```

> ps: 对于observe不是很理解的话，推荐查看其单元测试
对于以上代码推荐直接查看其单元测试
(单元测试地址)[https://github.com/vuejs/vue/blob/2.6/test/unit/modules/observer/observer.spec.js]
如下
```javascript
  it('observing object prop change', () => {
    const obj = { a: { b: 2 }, c: NaN }
    observe(obj)
    // mock a watcher!
    const watcher = {
      deps: [],
      addDep (dep) {
        this.deps.push(dep)
        dep.addSub(this)
      },
      update: jasmine.createSpy()
    }
    // collect dep
    Dep.target = watcher
    obj.a.b
    Dep.target = null
    expect(watcher.deps.length).toBe(3) // obj.a + a + a.b
    //这里
    obj.a.b = 3
    expect(watcher.update.calls.count()).toBe(1)
    // swap object
    obj.a = { b: 4 }
    expect(watcher.update.calls.count()).toBe(2)
    watcher.deps = []

    Dep.target = watcher
    obj.a.b
    obj.c
    Dep.target = null
    expect(watcher.deps.length).toBe(4)
    // set on the swapped object
    obj.a.b = 5
    expect(watcher.update.calls.count()).toBe(3)
    // should not trigger on NaN -> NaN set
    obj.c = NaN
    expect(watcher.update.calls.count()).toBe(3)
  })
```
> 接下来理一理geter和seter什么时候会被调用？然后dep与watcher什么时候会被真正的绑定和出发更新？



