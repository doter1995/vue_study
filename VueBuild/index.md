# vue构建分析

## build指令分析

1. 通过读取config.js中配置，获取所有配置的打包项。
2. 通过判断调用参数，进行过滤
3. 使用rollup进行打包
4. 打包过程中判断是否需要使用terser.minify，进行压缩代码
5. 使用zlib.gzip进行压缩。

## config.js中的builds
```javascript
 builds = {
    ...,
    // Runtime+compiler development build (Browser)
    'web-full-dev': {
        entry: resolve ('web/entry-runtime-with-compiler.js'),
        dest: resolve ('dist/vue.js'),
        format: 'umd',
        env: 'development',
        alias: {he: './entity-decoder'},
        banner,
    },
 }
 
```
配置中有entry项。所以我们可以明确的从对应entry中，去下手分析源码。