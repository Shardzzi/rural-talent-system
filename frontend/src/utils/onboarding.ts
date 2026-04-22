import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { DriveStep } from 'driver.js'

const adminSteps: DriveStep[] = [
  { element: '.sidebar-nav', popover: { title: '导航菜单', description: '通过左侧菜单访问不同功能模块', side: 'right' } },
  { element: '.search-area', popover: { title: '搜索功能', description: '支持按技能、学历、年龄等多条件搜索人才', side: 'bottom' } },
  { element: '.person-table', popover: { title: '人才列表', description: '查看和管理所有人才信息，支持排序和筛选', side: 'top' } },
  { element: '.add-person-btn', popover: { title: '添加人才', description: '点击此处录入新的人才信息', side: 'bottom' } },
  { element: '.header-bar', popover: { title: '顶部工具栏', description: '查看通知、修改设置或退出登录', side: 'bottom' } }
]

const userSteps: DriveStep[] = [
  { element: '.sidebar-nav', popover: { title: '导航菜单', description: '通过左侧菜单浏览人才信息', side: 'right' } },
  { element: '.search-area', popover: { title: '搜索功能', description: '搜索感兴趣的人才信息', side: 'bottom' } },
  { element: '.person-table', popover: { title: '人才列表', description: '浏览所有公开的人才信息', side: 'top' } }
]

export function startOnboarding(role: 'admin' | 'user' | 'guest') {
  const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    doneBtnText: '完成',
    progressText: '{{current}} / {{total}}',
    onDestroyStarted: () => {
      localStorage.setItem('onboarding-completed', 'true')
      driverObj.destroy()
    }
  })

  const steps = role === 'admin' ? adminSteps : userSteps
  driverObj.setSteps(steps)
  driverObj.drive()
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem('onboarding-completed')
}

export function resetOnboarding(): void {
  localStorage.removeItem('onboarding-completed')
}
