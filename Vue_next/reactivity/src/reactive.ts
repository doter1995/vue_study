import { isObject, toTypeString } from '@vue/shared'
import { mutableHandlers, readonlyHandlers } from './baseHandlers'
import {
  mutableCollectionHandlers,
  readonlyCollectionHandlers
} from './collectionHandlers'
import { ReactiveEffect } from './effect'
import { UnwrapRef, Ref } from './ref'
import { makeMap } from '@vue/shared'

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
export type Dep = Set<ReactiveEffect>
export type KeyToDepMap = Map<string | symbol, Dep>
export const targetMap = new WeakMap<any, KeyToDepMap>()

// WeakMaps that store {raw <-> observed} pairs.
const rawToReactive = new WeakMap<any, any>()
const reactiveToRaw = new WeakMap<any, any>()
const rawToReadonly = new WeakMap<any, any>()
const readonlyToRaw = new WeakMap<any, any>()

// WeakSets for values that are marked readonly or non-reactive during
// observable creation.
const readonlyValues = new WeakSet<any>()
const nonReactiveValues = new WeakSet<any>()

const collectionTypes = new Set<Function>([Set, Map, WeakMap, WeakSet])
const isObservableType = /*#__PURE__*/ makeMap(
  ['Object', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet']
    .map(t => `[object ${t}]`)
    .join(',')
)

const canObserve = (value: any): boolean => {
  // 判断该对象是否可以监听
  // 1.非Vue对象
  // 2.非VNode对象
  // 3.可以监听的对象类型
  // 4.不在不需要Reactive的set里
  return (
    !value._isVue &&
    !value._isVNode &&
    isObservableType(toTypeString(value)) &&
    !nonReactiveValues.has(value)
  )
}

// only unwrap nested ref
type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRef<T>
// 将object转为响应数据
export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
export function reactive(target: object) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (readonlyToRaw.has(target)) {
    return target
  }
  // target is explicitly marked as readonly by user
  if (readonlyValues.has(target)) {
    return readonly(target)
  }
  return createReactiveObject(
    target,
    rawToReactive,
    reactiveToRaw,
    mutableHandlers,
    mutableCollectionHandlers
  )
}
// 创建只读的监听
export function readonly<T extends object>(
  target: T
): Readonly<UnwrapNestedRefs<T>> {
  //值是可变的可观察值，检索其原始值并返回只读版本
  if (reactiveToRaw.has(target)) {
    target = reactiveToRaw.get(target)
  }
  //创建ReactiveObject对象
  return createReactiveObject(
    target,
    rawToReadonly,
    readonlyToRaw,
    readonlyHandlers,
    readonlyCollectionHandlers
  )
}
//创建ReactiveObject对象
// @ts-ignore
function createReactiveObject(
  target: any,
  toProxy,
  toRaw: WeakMap<any, any>,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>
) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // target already has corresponding Proxy
  let observed = toProxy.get(target)
  if (observed !== void 0) {
    return observed
  }
  // target is already a Proxy
  if (toRaw.has(target)) {
    return target
  }
  // only a whitelist of value types can be observed.
  if (!canObserve(target)) {
    return target
  }
  // 获取handler
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers
  // 设置代理handlers
  observed = new Proxy(target, handlers)
  // 将target, observed绑定到toProxy和toRaw中
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  // 将target加入tragetMap
  if (!targetMap.has(target)) {
    targetMap.set(target, new Map())
  }
  return observed
}
// 判断value是否为isReactive
export function isReactive(value: any): boolean {
  return reactiveToRaw.has(value) || readonlyToRaw.has(value)
}
// 判断是否为可读
export function isReadonly(value: any): boolean {
  return readonlyToRaw.has(value)
}
// 获取其原始值
export function toRaw<T>(observed: T): T {
  return reactiveToRaw.get(observed) || readonlyToRaw.get(observed) || observed
}
// 标记为只读
export function markReadonly<T>(value: T): T {
  readonlyValues.add(value)
  return value
}
// 标记为NonReactive
export function markNonReactive<T>(value: T): T {
  nonReactiveValues.add(value)
  return value
}
