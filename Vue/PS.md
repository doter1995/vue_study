## 关于data的watch问题。
今天看见同事写了一段l类似如下代码：
```
window.test = 1
window.app = new Vue({
    el: "#app",
    data() {
        return {
            self: window,
        }
    },
    template: "<div>{{self.test}}</div>"
})
```
开始看到的时候，我在想self就是window，self属于data，所以初始化会被observe了。
那么等初始化完成，渲染的时候self(window)会被监听。那么当window发生任何变化，比如:window.test1 = 2;这种情况下就有可能触发vue的更新。
but回家测试了一把：
![test](/Vue/image/WechatIMG308.png)
对window.test进行了赋值，but组件并没有刷新。

猜想失败。

仔细查看了一下app的状态

![test](/Vue/image/WechatIMG124.png)

看到问题了吧。
回去看源码会发现，其实VUE将data的值全部放到`_data`中,然后会在实例vm上代理一个geter seter方法。
然后当我们对vm.test存/取值时候回调用代理的方法，然后去实例的`_data`中存/取值，同时还会做额外的工作，比如：
1. 当值取值时触发的geter，然后如果是在render或者初始化watcher的时候，会加入_update(更新组件渲染)或者watcher加入到dep中。
2. 当值更新时触发的seter，然后会通知其dep更新。比如更新watcher，和update。
app.self.test = 100;