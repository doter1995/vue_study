import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
//加入初始化函数
initMixin(Vue)
//加入state
stateMixin(Vue)
//加入事件
eventsMixin(Vue)
//加入生命周期
lifecycleMixin(Vue)
//加入render
renderMixin(Vue)

export default Vue
