/* @flow */

import config from '../config';
import {initProxy} from './proxy';
import {initState} from './state';
import {initRender} from './render';
import {initEvents} from './events';
import {mark, measure} from '../util/perf';
import {initLifecycle, callHook} from './lifecycle';
import {initProvide, initInjections} from './inject';
import {extend, mergeOptions, formatComponentName} from '../util/index';

let uid = 0;

export function initMixin (Vue: Class<Component>) {
  // 该方法是vue实例话的方法。
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark (startTag);
    }

    // 标记vue
    vm._isVue = true;
    // 合并options
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
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy (vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    //初始化生命周期
    initLifecycle (vm);
    //初始化事件
    initEvents (vm);
    //初始化render
    initRender (vm);
    callHook (vm, 'beforeCreate');
    //初始化Injections，vue2.2.1版本中的provide/inject
    initInjections (vm); // 处理 injections是在data/props之前初始化
    //此处会将object中的props,method,data,computed,watch进行初始化。
    initState (vm);
    //初始化provide vue2.2.1版本中的provide/inject
    initProvide (vm); // resolve provide after data/props
    //调用created
    callHook (vm, 'created');

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName (vm, false);
      mark (endTag);
      measure (`vue ${vm._name} init`, startTag, endTag);
    }
    //如果配置了el则,将其挂载到el下
    if (vm.$options.el) {
      vm.$mount (vm.$options.el);
    }
  };
}

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
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
