/* @flow */

import {warn, invokeWithErrorHandling} from 'core/util/index';
import {cached, isUndef, isTrue, isPlainObject} from 'shared/util';

const normalizeEvent = cached ((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean,
  handler?: Function,
  params?: Array<any>,
} => {
  const passive = name.charAt (0) === '&';
  name = passive ? name.slice (1) : name;
  const once = name.charAt (0) === '~'; // Prefixed last, checked first
  name = once ? name.slice (1) : name;
  const capture = name.charAt (0) === '!';
  name = capture ? name.slice (1) : name;
  return {
    name,
    once,
    capture,
    passive,
  };
});

export function createFnInvoker (
  fns: Function | Array<Function>,
  vm: ?Component
): Function {
  function invoker () {
    const fns = invoker.fns;
    if (Array.isArray (fns)) {
      const cloned = fns.slice ();
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling (
          cloned[i],
          null,
          arguments,
          vm,
          `v-on handler`
        );
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling (fns, null, arguments, vm, `v-on handler`);
    }
  }
  invoker.fns = fns;
  return invoker;
}

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
