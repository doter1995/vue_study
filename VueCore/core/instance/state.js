/* @flow */

import config from '../config';
import Watcher from '../observer/watcher';
import Dep, {pushTarget, popTarget} from '../observer/dep';
import {isUpdatingChildComponent} from './lifecycle';

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving,
} from '../observer/index';

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute,
} from '../util/index';

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};

export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key];
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty (target, key, sharedPropertyDefinition);
}

export function initState (vm: Component) {
  vm._watchers = [];
  const opts = vm.$options;
  //对props，methods，data，computed，watch进行初始化
  if (opts.props) initProps (vm, opts.props);
  if (opts.methods) initMethods (vm, opts.methods);
  if (opts.data) {
    initData (vm);
  } else {
    //如果data不存在，则只监听{}
    observe ((vm._data = {}), true /* asRootData */);
  }
  if (opts.computed) initComputed (vm, opts.computed);
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch (vm, opts.watch);
  }
}

function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {};
  const props = (vm._props = {});
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = (vm.$options._propKeys = []);
  const isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving (false);
  }
  for (const key in propsOptions) {
    keys.push (key);
    const value = validateProp (key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate (key);
      if (
        isReservedAttribute (hyphenatedKey) ||
        config.isReservedAttr (hyphenatedKey)
      ) {
        warn (
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        );
      }
      defineReactive (props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn (
            `Avoid mutating a prop directly since the value will be ` +
              `overwritten whenever the parent component re-renders. ` +
              `Instead, use a data or computed property based on the prop's ` +
              `value. Prop being mutated: "${key}"`,
            vm
          );
        }
      });
    } else {
      defineReactive (props, key, value);
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy (vm, `_props`, key);
    }
  }
  toggleObserving (true);
}

function initData (vm: Component) {
  let data = vm.$options.data;
  // data可以传递function或者object
  //如果data是function，则调用方法，拿到返回值
  data = vm._data = typeof data === 'function'
    ? getData (data, vm)
    : data || {};
  if (!isPlainObject (data)) {
    data = {};
    process.env.NODE_ENV !== 'production' &&
      warn (
        'data functions should return an object:\n' +
          'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      );
  }
  // 将data代理到实例的_data上
  const keys = Object.keys (data);
  const props = vm.$options.props;
  const methods = vm.$options.methods;
  let i = keys.length;
  //遍历data的key
  while (i--) {
    const key = keys[i];
    //警告校验，data中的key是否在methods,props中已经存在
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn (methods, key)) {
        warn (
          `Method "${key}" has already been defined as a data property.`,
          vm
        );
      }
    }
    // 如果发现props中已经存在,则不会对其代理到_data
    if (props && hasOwn (props, key)) {
      process.env.NODE_ENV !== 'production' &&
        warn (
          `The data property "${key}" is already declared as a prop. ` +
            `Use prop default value instead.`,
          vm
        );
    } else if (!isReserved (key)) {
      // 将data中某个值代理到vm._data上
      proxy (vm, `_data`, key);
    }
  }
  // 监听data
  observe (data, true /* asRootData */);
}

export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget ();
  try {
    return data.call (vm, vm);
  } catch (e) {
    handleError (e, vm, `data()`);
    return {};
  } finally {
    popTarget ();
  }
}

const computedWatcherOptions = {lazy: true};

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = (vm._computedWatchers = Object.create (null));
  // computed properties are just getters during SSR
  const isSSR = isServerRendering ();

  for (const key in computed) {
    const userDef = computed[key];
    const getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn (`Getter is missing for computed property "${key}".`, vm);
    }

    if (!isSSR) {
      //如果不是服务端渲染，在创建Watcher。
      // create internal watcher for the computed property.
      //为_computedWatchers挂载watcher
      watchers[key] = new Watcher (
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      // 定义Computed
      defineComputed (vm, key, userDef);
    } else if (process.env.NODE_ENV !== 'production') {
      //警告校验，对data和props
      if (key in vm.$data) {
        warn (`The computed property "${key}" is already defined in data.`, vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn (
          `The computed property "${key}" is already defined as a prop.`,
          vm
        );
      }
    }
  }
}

export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering ();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter (key)
      : createGetterInvoker (userDef);
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
          ? createComputedGetter (key)
          : createGetterInvoker (userDef.get)
      : noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    sharedPropertyDefinition.set === noop
  ) {
    sharedPropertyDefinition.set = function () {
      warn (
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      );
    };
  }
  //将其computed的key代理到vm中。
  Object.defineProperty (target, key, sharedPropertyDefinition);
}

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

function createGetterInvoker (fn) {
  return function computedGetter () {
    return fn.call (this, this);
  };
}

function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props;
  for (const key in methods) {
    //对其进行警告校验
    if (process.env.NODE_ENV !== 'production') {
      //判断是否为function
      if (typeof methods[key] !== 'function') {
        warn (
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
            `Did you reference the function correctly?`,
          vm
        );
      }
      // 判断该方法是否在props中以定义
      if (props && hasOwn (props, key)) {
        warn (`Method "${key}" has already been defined as a prop.`, vm);
      }
      if (key in vm && isReserved (key)) {
        warn (
          `Method "${key}" conflicts with an existing Vue instance method. ` +
            `Avoid defining component methods that start with _ or $.`
        );
      }
    }
    //将方法bind到实例上
    vm[key] = typeof methods[key] !== 'function'
      ? noop
      : bind (methods[key], vm);
  }
}

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

function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject (handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  //调用vm.$watch来注册watch
  return vm.$watch (expOrFn, handler, options);
}

export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {};
  dataDef.get = function () {
    return this._data;
  };
  const propsDef = {};
  propsDef.get = function () {
    return this._props;
  };
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn (
        'Avoid replacing instance root $data. ' +
          'Use nested data properties instead.',
        this
      );
    };
    propsDef.set = function () {
      warn (`$props is readonly.`, this);
    };
  }
  Object.defineProperty (Vue.prototype, '$data', dataDef);
  Object.defineProperty (Vue.prototype, '$props', propsDef);
  //加入$set，$delete方法
  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;
  //加入$watch
  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this;
    if (isPlainObject (cb)) {
      return createWatcher (vm, expOrFn, cb, options);
    }
    options = options || {};
    options.user = true;
    const watcher = new Watcher (vm, expOrFn, cb, options);
    //如果配置立即执行，则先调用一次
    if (options.immediate) {
      try {
        cb.call (vm, watcher.value);
      } catch (error) {
        handleError (
          error,
          vm,
          `callback for immediate watcher "${watcher.expression}"`
        );
      }
    }
    return function unwatchFn () {
      watcher.teardown ();
    };
  };
}
