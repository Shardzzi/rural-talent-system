declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

// 声明全局类型
declare module '@/*' {
  const value: any
  export default value
}
