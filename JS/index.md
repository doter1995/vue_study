# 读源码中学习到的代码技巧

## 重写方法
```javascript
var a={
    title:"A",
    log:function (text){
      console.log("this.title:",this.title);
      console.log("this.text:",text);
    }
}
var func = a.log
a.log = function(){
    console.log("this is new func");
    func.apply(this,arguments)
}
a.log("A text")
```
### 生成一个纯净的对象
```javascript
Object.create(null)
```
![对比图](./image/objectPropperties.png)
```javascript
a = {a:1,b:{b:1}}
Object.create(a)
```
![Object创建图](./image/objectCreate.png)

### Object.seal 创建密封对象

密封对象：即不可增删属性的对象

[Object.seal](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/seal)

### Set和WeakSet,Map与WeakMap

[WeakSet和WeakMap](http://es6.ruanyifeng.com/#docs/set-map#WeakSet)

### proxy

[Proxy](https://www.jianshu.com/p/4a5eca0536c3)

### String方法
### 前后缀判断`startsWith` & `endsWith`
```javascript
"aaa".startsWith("1") //false
"aaa".startsWith("a") // true

"aaa".endsWith("1") //false
"aaa".endsWith("a") // true

```
