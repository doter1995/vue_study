## Vue源码分析。
> 通过从build的config配置中可以确定，vue是从`src/platforms/web/webentry-runtime-with-compiler.js`做为entry入口。

根据文件追踪到`src/core`下的定义;

### Core下的Vue
继续追踪到`/src/core/instance/index.js`文件为中初始的定义。
[VUE各种方法挂载顺序](/VueCore/core/instance/index.js)

### VUE实例化时的顺序
在`src/core/instance/index.js`会调用在`_init`方法进行实例化

[参考注解源码](/VueCore/core/instance/init.js)
1. [合并option](/Vue/mergeOptions.md)
2. [初始化生命周期](/Vue/initLifecycle.md)
`initLifecycle(vm)`
3. [初始化事件](/Vue/initEvents.md)
`initEvents(vm)`
4. [初始化render](/Vue/initRender.md)
`initRender(vm)`
5. 调用beforeCreate
`callHook(vm, 'beforeCreate')`
6. 初始化Injections，vue2.2.1版本中的provide/inject
`initInjections(vm)` // 处理 injections是在data/props之前初始化
7. 此处会将object中的props,method,data,computed,watch进行初始化。
[初始化State](/Vue/initState.md)
`initState(vm)`
8. 初始化provide vue2.2.1版本中的provide/inject
`initProvide(vm)` // resolve provide after data/props
9. 调用created
`callHook(vm, 'created')`
10. 调用$mount()进行渲染


