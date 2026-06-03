import {
  Check,
  ChevronRight,
  Circle,
  Folder,
  History,
  Languages,
  ListTodo,
  Maximize2,
  Minimize2,
  Moon,
  Palette,
  Pin,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import type { CSSProperties, MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type TaskStatus = 'todo' | 'done'
type StatusFilter = 'all' | TaskStatus
type ThemeMode = 'light' | 'dark'
type PanelTab = 'history' | 'settings'
type Lang = 'zh' | 'en'

type Task = {
  id: string
  tabId?: string // legacy field, kept for backward-compatible storage
  title: string
  note: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
}

type DayGroup = {
  key: string
  label: string
  tasks: Task[]
}

type WeekGroup = {
  key: string
  label: string
  tasks: Task[]
  days: DayGroup[]
  todoCount: number
}

type ThemeSettings = {
  mode: ThemeMode
  accent: string
  tint: string
  preset: string
  fontScale: number
}

type ThemePreset = {
  id: string
  name: string
  nameEn: string
  emoji: string
  mode: ThemeMode
  accent: string
  tint: string
}

type ViewSettings = {
  compact: boolean
  historyFullscreen: boolean
  opacity: number
  pinned: boolean
  prevOpacity: number
  panel: PanelTab
  panelOpen: boolean
  settingsOpen: boolean
}

type AppState = {
  tasks: Task[]
  weekNames: Record<string, string>
  lang: Lang
  theme: ThemeSettings
  view: ViewSettings
}

type PendingHeaderDrag = {
  dragging: boolean
  moving: boolean
  pointerX: number
  pointerY: number
  windowX?: number
  windowY?: number
  x: number
  y: number
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

const STORAGE_KEY = 'remarkbook-state-v3'
const LEGACY_STORAGE_KEYS = ['remarkbook-state-v2', 'remarkbook-state-v1']
const EXPANDED_SIZE = { height: 560, width: 420 }
const HISTORY_SIZE = { height: 720, width: 520 }
const COMPACT_SIZE = { height: 64, width: 320 }
const PINNED_OPACITY = 0.2
const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const THEME_PRESETS: ThemePreset[] = [
  { id: 'cream', name: '奶油', nameEn: 'Cream', emoji: '🍦', mode: 'light', accent: '#f2a65a', tint: '#f7b56e' },
  { id: 'sakura', name: '樱花', nameEn: 'Sakura', emoji: '🌸', mode: 'light', accent: '#f1799f', tint: '#f7a8c4' },
  { id: 'mint', name: '薄荷', nameEn: 'Mint', emoji: '🌿', mode: 'light', accent: '#37b89e', tint: '#83d4c4' },
  { id: 'lavender', name: '薰衣草', nameEn: 'Lavender', emoji: '💜', mode: 'light', accent: '#9580d9', tint: '#bcabec' },
  { id: 'seasalt', name: '海盐', nameEn: 'Sea salt', emoji: '🧊', mode: 'light', accent: '#5a9bd6', tint: '#93c2ea' },
  { id: 'night', name: '深夜', nameEn: 'Midnight', emoji: '🌙', mode: 'dark', accent: '#f2a65a', tint: '#6a5a92' },
]

const I18N = {
  zh: {
    thisWeek: '本周',
    history: '历史',
    settings: '设置',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    accent: '主色',
    fontSize: '字号',
    opacity: '透明度',
    language: '语言',
    pin: '置顶',
    pinOnTop: '一直在最前',
    showDone: '显示已完成',
    hideDone: '隐藏已完成',
    weekTodo: '本周未完成',
    weekAll: '本周全部',
    carryOver: '往周未完成',
    today: '今天',
    todayTodo: '今天未完成',
    todayAll: '今天全部',
    latestRecord: '最新记录',
    weeklyHistory: '每周记录',
    noHistory: '还没有记录。',
    taskUnit: '条',
    writeSomething: '写点事...',
    searchTask: '搜索任务',
    all: '全部',
    todo: '未完成',
    done: '已完成',
    noMatch: '没有匹配的记录。',
    emptyTodo: '这里还没有待办。',
    emptyTask: '暂无任务。',
    addTask: '添加任务',
    windowControls: '窗口控制',
    collapse: '收起为小窗',
    expandHistory: '全屏查看历史',
    minimize: '最小化',
    restoreHistory: '缩小历史',
    themeSettings: '主题与设置',
    closeSettings: '关闭设置',
    more: '更多',
    renameHint: '双击改名',
    expand: '展开备忘录',
    note: '备忘',
  },
  en: {
    thisWeek: 'This week',
    history: 'History',
    settings: 'Settings',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    accent: 'Accent',
    fontSize: 'Font',
    opacity: 'Opacity',
    language: 'Language',
    pin: 'Pin',
    pinOnTop: 'Always on top',
    showDone: 'Show done',
    hideDone: 'Hide done',
    weekTodo: 'This week to-do',
    weekAll: 'This week (all)',
    carryOver: 'Earlier unfinished',
    today: 'Today',
    todayTodo: "Today's to-do",
    todayAll: 'Today (all)',
    latestRecord: 'Latest',
    weeklyHistory: 'Weekly records',
    noHistory: 'No records yet.',
    taskUnit: '',
    writeSomething: 'Write something...',
    searchTask: 'Search tasks',
    all: 'All',
    todo: 'To-do',
    done: 'Done',
    noMatch: 'No matching records.',
    emptyTodo: 'Nothing to do yet.',
    emptyTask: 'No tasks.',
    addTask: 'Add task',
    windowControls: 'Window controls',
    collapse: 'Collapse to mini',
    expandHistory: 'Fullscreen history',
    minimize: 'Minimize',
    restoreHistory: 'Restore history',
    themeSettings: 'Theme & settings',
    closeSettings: 'Close settings',
    more: 'More',
    renameHint: 'Double-click to rename',
    expand: 'Expand notes',
    note: 'Notes',
  },
}

type Strings = (typeof I18N)['zh']

const createId = () => crypto.randomUUID()
const nowIso = () => new Date().toISOString()

const defaultState: AppState = {
  tasks: [
    {
      id: createId(),
      title: '写下第一件要记住的事',
      note: '',
      status: 'todo',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
  weekNames: {},
  lang: 'zh',
  theme: {
    mode: 'light',
    accent: '#f2a65a',
    tint: '#f7b56e',
    preset: 'cream',
    fontScale: 1,
  },
  view: {
    compact: false,
    historyFullscreen: false,
    opacity: 0.94,
    pinned: false,
    prevOpacity: 0.94,
    panel: 'history',
    panelOpen: false,
    settingsOpen: false,
  },
}

function loadState(): AppState {
  let stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    for (const key of LEGACY_STORAGE_KEYS) {
      stored = localStorage.getItem(key)
      if (stored) {
        break
      }
    }
  }
  if (!stored) {
    return defaultState
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppState> & { tasks?: Task[] }
    if (!Array.isArray(parsed.tasks)) {
      return defaultState
    }

    return {
      tasks: parsed.tasks,
      weekNames:
        parsed.weekNames && typeof parsed.weekNames === 'object' ? parsed.weekNames : {},
      lang: parsed.lang === 'en' ? 'en' : 'zh',
      theme: {
        ...defaultState.theme,
        ...(parsed.theme || {}),
      },
      view: {
        ...defaultState.view,
        ...(parsed.view || {}),
        panel: 'history',
      },
    }
  } catch {
    return defaultState
  }
}

/** Monday-of-week key in local time, formatted YYYY-MM-DD. */
function weekStartKey(iso: string): string {
  const date = new Date(iso)
  date.setHours(0, 0, 0, 0)
  const mondayOffset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - mondayOffset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayStartKey(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function weekRangeLabel(key: string, lang: Lang): string {
  const start = new Date(`${key}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    day: 'numeric',
    month: 'numeric',
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

function dayLabel(key: string, lang: Lang): string {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (lang === 'zh') {
    return `${WEEKDAYS_ZH[date.getDay()]} ${month}月${day}日`
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(date)
}

function todayTitle(timestamp: number, lang: Lang): string {
  const date = new Date(timestamp)
  if (lang === 'zh') {
    return `今天 ${WEEKDAYS_ZH[date.getDay()]} ${date.getMonth() + 1}月${date.getDate()}日`
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(date)
}

function sortTasksDoneLast(sourceTasks: Task[]): Task[] {
  return [...sourceTasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'done' ? 1 : -1
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

function isVisibleInToday(task: Task, todayKey: string): boolean {
  const taskDayKey = dayStartKey(task.createdAt)
  if (taskDayKey === todayKey) {
    return true
  }

  return task.status === 'todo' && taskDayKey < todayKey
}

function buildWeekGroups(
  sourceTasks: Task[],
  lang: Lang,
  weekNames: Record<string, string>,
  currentKey: string,
): WeekGroup[] {
  const groups = new Map<string, Task[]>()

  for (const task of sourceTasks) {
    const key = weekStartKey(task.createdAt)
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(task)
    } else {
      groups.set(key, [task])
    }
  }

  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, weekTasks]) => {
      const sortedTasks = sortTasksDoneLast(weekTasks)
      const daysMap = new Map<string, Task[]>()

      for (const task of sortedTasks) {
        const key = dayStartKey(task.createdAt)
        const bucket = daysMap.get(key)
        if (bucket) {
          bucket.push(task)
        } else {
          daysMap.set(key, [task])
        }
      }

      const days = [...daysMap.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dayKey, dayTasks]) => ({
          key: dayKey,
          label: dayLabel(dayKey, lang),
          tasks: sortTasksDoneLast(dayTasks),
        }))

      const prefix = key === currentKey ? `${I18N[lang].thisWeek} ` : ''
      return {
        key,
        label: weekNames[key] || `${prefix}${weekRangeLabel(key, lang)}`,
        tasks: sortedTasks,
        days,
        todoCount: sortedTasks.filter((task) => task.status === 'todo').length,
      }
    })
}

function isTauriApp() {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
}

async function applyWindowMode(compact: boolean, historyOpen: boolean, historyFullscreen: boolean) {
  if (!isTauriApp()) {
    return
  }

  const {
    LogicalSize,
    PhysicalPosition,
    currentMonitor,
    getCurrentWindow,
    primaryMonitor,
  } = await import('@tauri-apps/api/window')

  const appWindow = getCurrentWindow()
  await appWindow.setBackgroundColor([0, 0, 0, 0])

  if (compact) {
    await appWindow.setDecorations(false)
    await appWindow.setShadow(false)
    await appWindow.setSize(new LogicalSize(COMPACT_SIZE.width, COMPACT_SIZE.height))

    const monitor = (await currentMonitor()) || (await primaryMonitor())
    if (monitor) {
      const margin = Math.round(16 * monitor.scaleFactor)
      const width = Math.round(COMPACT_SIZE.width * monitor.scaleFactor)
      const position = new PhysicalPosition(
        monitor.workArea.position.x + monitor.workArea.size.width - width - margin,
        monitor.workArea.position.y + margin,
      )
      await appWindow.setPosition(position)
    }
    return
  }

  // Expanded mode is frameless too, so our own rounded shell + traffic lights
  // own the chrome instead of the native title bar.
  await appWindow.setDecorations(false)
  await appWindow.setShadow(false)

  if (historyFullscreen) {
    const monitor = (await currentMonitor()) || (await primaryMonitor())
    if (monitor) {
      await appWindow.setSize(
        new LogicalSize(
          Math.round(monitor.workArea.size.width / monitor.scaleFactor),
          Math.round(monitor.workArea.size.height / monitor.scaleFactor),
        ),
      )
      await appWindow.setPosition(
        new PhysicalPosition(monitor.workArea.position.x, monitor.workArea.position.y),
      )
      return
    }
  }

  const targetSize = historyOpen ? HISTORY_SIZE : EXPANDED_SIZE
  await appWindow.setSize(new LogicalSize(targetSize.width, targetSize.height))

  const monitor = (await currentMonitor()) || (await primaryMonitor())
  if (monitor) {
    const width = Math.round(targetSize.width * monitor.scaleFactor)
    const height = Math.round(targetSize.height * monitor.scaleFactor)
    await appWindow.setPosition(
      new PhysicalPosition(
        monitor.workArea.position.x + Math.round((monitor.workArea.size.width - width) / 2),
        monitor.workArea.position.y + Math.round((monitor.workArea.size.height - height) / 2),
      ),
    )
  }
}

async function applyAlwaysOnTop(onTop: boolean) {
  if (!isTauriApp()) {
    return
  }
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().setAlwaysOnTop(onTop)
}

async function beginWindowDrag() {
  if (!isTauriApp()) {
    return
  }

  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().startDragging()
}

async function startWindowDrag(event: MouseEvent) {
  if (!isTauriApp() || event.button !== 0) {
    return
  }

  const target = event.target as HTMLElement
  if (target.closest('button, input, textarea')) {
    return
  }

  await beginWindowDrag()
}

function App() {
  const [state, setState] = useState(loadState)
  const [draftTitle, setDraftTitle] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyStatus, setHistoryStatus] = useState<StatusFilter>('all')
  const [composing, setComposing] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const pendingHeaderDrag = useRef<PendingHeaderDrag | null>(null)

  const { tasks, weekNames, lang, theme, view } = state
  const t = I18N[lang]

  const currentKey = useMemo(
    () => weekStartKey(new Date(currentTime).toISOString()),
    [currentTime],
  )

  useEffect(() => {
    void applyWindowMode(view.compact, view.panelOpen, view.historyFullscreen)
  }, [view.compact, view.historyFullscreen, view.panelOpen])

  useEffect(() => {
    void applyAlwaysOnTop(view.compact || view.pinned)
  }, [view.compact, view.pinned])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  const persist = (nextState: AppState) => {
    setState(nextState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  }

  const updateView = (nextView: Partial<ViewSettings>) => {
    persist({ ...state, view: { ...view, ...nextView } })
  }

  const updateTheme = (nextTheme: Partial<ThemeSettings>) => {
    persist({ ...state, theme: { ...theme, ...nextTheme } })
  }

  const todayKey = useMemo(() => dayStartKey(new Date(currentTime).toISOString()), [currentTime])

  const todayTasks = useMemo(
    () => sortTasksDoneLast(tasks.filter((task) => isVisibleInToday(task, todayKey))),
    [tasks, todayKey],
  )

  const historyWeeks = useMemo(() => {
    const query = historyQuery.trim().toLowerCase()
    const filtered = tasks.filter((task) => {
      if (historyStatus !== 'all' && task.status !== historyStatus) {
        return false
      }
      return !query || `${task.title} ${task.note}`.toLowerCase().includes(query)
    })

    return buildWeekGroups(filtered, lang, weekNames, currentKey)
  }, [currentKey, historyQuery, historyStatus, lang, tasks, weekNames])

  const todayCount = todayTasks.length
  const todayTodoCount = todayTasks.filter((task) => task.status === 'todo').length
  const todayLabel = useMemo(() => todayTitle(currentTime, lang), [currentTime, lang])
  const todayHeading = lang === 'zh' ? `${todayLabel}（${todayCount}）` : `${todayLabel} (${todayCount})`
  const latestTask = useMemo(
    () => [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [tasks],
  )
  const latestTitle = latestTask?.title || t.writeSomething

  const addTask = () => {
    const title = draftTitle.trim()
    if (!title) {
      return
    }

    const nextTask: Task = {
      id: createId(),
      title,
      note: '',
      status: 'todo',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    persist({ ...state, tasks: [nextTask, ...tasks] })
    setDraftTitle('')
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    persist({
      ...state,
      tasks: tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completedAt: status === 'done' ? nowIso() : undefined,
              status,
              updatedAt: nowIso(),
            }
          : task,
      ),
    })
  }

  const deleteTask = (taskId: string) => {
    persist({ ...state, tasks: tasks.filter((task) => task.id !== taskId) })
  }

  const togglePin = () => {
    if (view.pinned) {
      updateView({ pinned: false, opacity: view.prevOpacity })
    } else {
      updateView({ pinned: true, prevOpacity: view.opacity, opacity: PINNED_OPACITY })
    }
  }

  const toggleHistoryPanel = () => {
    updateView({
      historyFullscreen: false,
      panel: 'history',
      panelOpen: !view.panelOpen,
      settingsOpen: false,
    })
  }

  const toggleHistoryFullscreen = () => {
    if (view.historyFullscreen) {
      updateView({
        historyFullscreen: false,
        panelOpen: false,
        settingsOpen: false,
      })
      return
    }

    updateView({
      compact: false,
      historyFullscreen: true,
      panel: 'history',
      panelOpen: true,
      settingsOpen: false,
    })
  }

  const handleTopDoubleClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, input, textarea')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    pendingHeaderDrag.current = null
    toggleHistoryFullscreen()
  }

  const handleTopMouseDown = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (event.button !== 0 || target.closest('button, input, textarea')) {
      return
    }

    event.stopPropagation()
    pendingHeaderDrag.current = {
      dragging: false,
      moving: false,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: event.clientX,
      y: event.clientY,
    }

    if (!isTauriApp()) {
      return
    }

    const pointerX = event.clientX
    const pointerY = event.clientY
    void (async () => {
      const { cursorPosition, getCurrentWindow } = await import('@tauri-apps/api/window')
      const [cursor, windowPosition] = await Promise.all([
        cursorPosition(),
        getCurrentWindow().outerPosition(),
      ])

      const pending = pendingHeaderDrag.current
      if (!pending || pending.pointerX !== pointerX || pending.pointerY !== pointerY) {
        return
      }

      pendingHeaderDrag.current = {
        ...pending,
        windowX: windowPosition.x,
        windowY: windowPosition.y,
        x: cursor.x,
        y: cursor.y,
      }
    })()
  }

  const handleTopMouseMove = (event: MouseEvent<HTMLElement>) => {
    const pending = pendingHeaderDrag.current
    if (!pending || view.historyFullscreen || (event.buttons & 1) === 0) {
      return
    }

    const distanceX = Math.abs(event.clientX - pending.pointerX)
    const distanceY = Math.abs(event.clientY - pending.pointerY)
    if (distanceX < 4 && distanceY < 4) {
      return
    }

    if (
      !isTauriApp() ||
      pending.moving ||
      pending.windowX === undefined ||
      pending.windowY === undefined
    ) {
      return
    }

    pendingHeaderDrag.current = { ...pending, dragging: true, moving: true }
    void (async () => {
      const { PhysicalPosition, cursorPosition, getCurrentWindow } = await import('@tauri-apps/api/window')
      const cursor = await cursorPosition()
      await getCurrentWindow().setPosition(
        new PhysicalPosition(
          pending.windowX! + cursor.x - pending.x,
          pending.windowY! + cursor.y - pending.y,
        ),
      )

      const latest = pendingHeaderDrag.current
      if (!latest) {
        return
      }

      pendingHeaderDrag.current = {
        ...latest,
        moving: false,
      }
    })()
  }

  const clearPendingTopDrag = () => {
    pendingHeaderDrag.current = null
  }

  const openSettingsDialog = () => {
    updateView({ historyFullscreen: false, panelOpen: false, settingsOpen: true })
  }

  const closeSettingsDialog = () => {
    updateView({ settingsOpen: false })
  }

  return (
    <main
      className="app"
      data-compact={view.compact}
      data-history-fullscreen={view.historyFullscreen}
      data-panel-open={view.panelOpen}
      data-settings-open={view.settingsOpen}
      data-theme={theme.mode}
      style={
        {
          '--accent': theme.accent,
          '--tint': theme.tint,
          '--app-opacity': view.opacity,
          '--font-scale': theme.fontScale,
        } as CSSProperties
      }
    >
      <section
        className="memo-shell"
        onMouseDown={startWindowDrag}
        onMouseMove={handleTopMouseMove}
        onMouseUp={clearPendingTopDrag}
      >
        {view.compact ? (
          <CompactTab opacity={view.opacity} t={t} title={latestTitle} todoCount={todayTodoCount} updateView={updateView} />
        ) : (
          <>
            <header
              className="memo-top"
              onDoubleClick={handleTopDoubleClick}
              onMouseDown={handleTopMouseDown}
              onMouseMove={handleTopMouseMove}
              onMouseUp={clearPendingTopDrag}
            >
              <div className="traffic-lights" aria-label={t.windowControls}>
                <button
                  className="light red"
                  onClick={() =>
                    updateView({
                      compact: true,
                      historyFullscreen: false,
                      panelOpen: false,
                      settingsOpen: false,
                    })
                  }
                  title={t.collapse}
                  type="button"
                >
                  <X size={9} strokeWidth={3} />
                </button>
                <button
                  className="light yellow"
                  onClick={toggleHistoryFullscreen}
                  title={view.historyFullscreen ? t.restoreHistory : t.expandHistory}
                  type="button"
                >
                  {view.historyFullscreen ? (
                    <Minimize2 size={9} strokeWidth={3} />
                  ) : (
                    <Maximize2 size={9} strokeWidth={3} />
                  )}
                </button>
                <button
                  className="light green"
                  onClick={openSettingsDialog}
                  title={t.themeSettings}
                  type="button"
                >
                  <Palette size={8} strokeWidth={3} />
                </button>
              </div>
              <div className="header-title">{todayHeading}</div>
              <div className="top-actions">
                <button
                  className={view.pinned ? 'icon-button active' : 'icon-button'}
                  onClick={togglePin}
                  title={t.pinOnTop}
                  type="button"
                >
                  <Pin size={16} />
                </button>
                <button
                  className={view.panelOpen ? 'icon-button active' : 'icon-button'}
                  onClick={toggleHistoryPanel}
                  title={t.history}
                  type="button"
                >
                  <History size={16} />
                </button>
              </div>
            </header>

            <section className="memo-body">
              <section className="soft-section">
                <div className="section-line">
                  <ListTodo size={14} />
                  <span>{t.todayAll}</span>
                  <button
                    className={composing ? 'add-toggle active' : 'add-toggle'}
                    onClick={() => setComposing((value) => !value)}
                    title={t.addTask}
                    type="button"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {composing && (
                  <form
                    className="quick-entry"
                    onSubmit={(event) => {
                      event.preventDefault()
                      addTask()
                    }}
                  >
                    <input
                      autoFocus
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setDraftTitle('')
                          setComposing(false)
                        }
                      }}
                      placeholder={t.writeSomething}
                      value={draftTitle}
                    />
                    <button aria-label={t.addTask} type="submit">
                      <Plus size={18} />
                    </button>
                  </form>
                )}
                <TaskList
                  emptyText={t.emptyTask}
                  lang={lang}
                  onDelete={deleteTask}
                  onStatusChange={updateTaskStatus}
                  tasks={todayTasks}
                />
              </section>
            </section>

            {view.panelOpen && (
              <HiddenPanel
                historyQuery={historyQuery}
                historyStatus={historyStatus}
                historyWeeks={historyWeeks}
                lang={lang}
                onDelete={deleteTask}
                onStatusChange={updateTaskStatus}
                openPanel={() => updateView({ panel: 'history', panelOpen: true, settingsOpen: false })}
                panel="history"
                setHistoryQuery={setHistoryQuery}
                setHistoryStatus={setHistoryStatus}
                setLang={(nextLang) => persist({ ...state, lang: nextLang })}
                t={t}
                theme={theme}
                togglePin={togglePin}
                updateTheme={updateTheme}
                updateView={updateView}
                view={view}
              />
            )}

            {view.settingsOpen && (
              <SettingsDialog
                closeSettingsDialog={closeSettingsDialog}
                lang={lang}
                setLang={(nextLang) => persist({ ...state, lang: nextLang })}
                t={t}
                theme={theme}
                togglePin={togglePin}
                updateTheme={updateTheme}
                updateView={updateView}
                view={view}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}

function CompactTab({
  opacity,
  t,
  title,
  todoCount,
  updateView,
}: {
  opacity: number
  t: Strings
  title: string
  todoCount: number
  updateView: (nextView: Partial<ViewSettings>) => void
}) {
  return (
    <div className="compact-tab">
      <button className="compact-main" onClick={() => updateView({ compact: false })} title={t.expand} type="button">
        <Maximize2 size={15} />
        <span>{title}</span>
        <strong>{todoCount}</strong>
      </button>
      <input
        aria-label={t.opacity}
        max="1"
        min="0.45"
        onChange={(event) => updateView({ opacity: Number(event.target.value) })}
        step="0.05"
        title={t.opacity}
        type="range"
        value={opacity}
      />
    </div>
  )
}

function SettingsDialog({
  closeSettingsDialog,
  lang,
  setLang,
  t,
  theme,
  togglePin,
  updateTheme,
  updateView,
  view,
}: {
  closeSettingsDialog: () => void
  lang: Lang
  setLang: (lang: Lang) => void
  t: Strings
  theme: ThemeSettings
  togglePin: () => void
  updateTheme: (nextTheme: Partial<ThemeSettings>) => void
  updateView: (nextView: Partial<ViewSettings>) => void
  view: ViewSettings
}) {
  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        event.stopPropagation()
        if (event.target === event.currentTarget) {
          closeSettingsDialog()
        }
      }}
      role="presentation"
    >
      <section
        aria-label={t.themeSettings}
        aria-modal="true"
        className="settings-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="settings-dialog-head">
          <div>
            <SlidersHorizontal size={16} />
            <span>{t.settings}</span>
          </div>
          <button className="modal-close" onClick={closeSettingsDialog} title={t.closeSettings} type="button">
            <X size={16} />
          </button>
        </header>
        <div className="settings-dialog-body">
          <HiddenPanel
            historyQuery=""
            historyStatus="all"
            historyWeeks={[]}
            lang={lang}
            onDelete={() => undefined}
            onStatusChange={() => undefined}
            openPanel={() => undefined}
            panel="settings"
            setHistoryQuery={() => undefined}
            setHistoryStatus={() => undefined}
            setLang={setLang}
            t={t}
            theme={theme}
            togglePin={togglePin}
            updateTheme={updateTheme}
            updateView={updateView}
            view={view}
          />
        </div>
      </section>
    </div>
  )
}

function HiddenPanel({
  historyQuery,
  historyStatus,
  historyWeeks,
  lang,
  onDelete,
  onStatusChange,
  openPanel,
  panel,
  setHistoryQuery,
  setHistoryStatus,
  setLang,
  t,
  theme,
  togglePin,
  updateTheme,
  updateView,
  view,
}: {
  historyQuery: string
  historyStatus: StatusFilter
  historyWeeks: WeekGroup[]
  lang: Lang
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  openPanel: (panel: PanelTab) => void
  panel: PanelTab
  setHistoryQuery: (query: string) => void
  setHistoryStatus: (status: StatusFilter) => void
  setLang: (lang: Lang) => void
  t: Strings
  theme: ThemeSettings
  togglePin: () => void
  updateTheme: (nextTheme: Partial<ThemeSettings>) => void
  updateView: (nextView: Partial<ViewSettings>) => void
  view: ViewSettings
}) {
  return (
    <aside className="hidden-panel">
      <div className="panel-tabs">
        <button className={panel === 'history' ? 'active' : ''} onClick={() => openPanel('history')} type="button">
          <History size={15} />
          {t.history}
        </button>
        <button className={panel === 'settings' ? 'active' : ''} onClick={() => openPanel('settings')} type="button">
          <SlidersHorizontal size={15} />
          {t.settings}
        </button>
      </div>

      {panel === 'history' && (
        <section className="panel-content">
          <label className="search-box">
            <Search size={15} />
            <input
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder={t.searchTask}
              value={historyQuery}
            />
          </label>
          <div className="segmented">
            {(['all', 'todo', 'done'] as StatusFilter[]).map((filter) => (
              <button
                className={historyStatus === filter ? 'active' : ''}
                key={filter}
                onClick={() => setHistoryStatus(filter)}
                type="button"
              >
                {filter === 'all' ? t.all : filter === 'todo' ? t.todo : t.done}
              </button>
            ))}
          </div>
          <div className="history-list">
            <WeeklyHistoryList
              compact
              emptyText={t.noMatch}
              lang={lang}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              t={t}
              weeks={historyWeeks}
            />
          </div>
        </section>
      )}

      {panel === 'settings' && (
        <section className="panel-content">
          <label className="setting-row opacity-setting">
            <span>{t.opacity}</span>
            <div className="setting-slider">
              <input
                aria-label={t.opacity}
                max="1"
                min="0.2"
                onChange={(event) => updateView({ opacity: Number(event.target.value) })}
                step="0.05"
                type="range"
                value={view.opacity}
              />
              <strong>{Math.round(view.opacity * 100)}%</strong>
            </div>
          </label>
          <div className="preset-grid">
            {THEME_PRESETS.map((preset) => (
              <button
                className={`preset-chip ${theme.preset === preset.id ? 'active' : ''}`}
                key={preset.id}
                onClick={() =>
                  updateTheme({
                    preset: preset.id,
                    mode: preset.mode,
                    accent: preset.accent,
                    tint: preset.tint,
                  })
                }
                style={{ '--swatch': preset.accent } as CSSProperties}
                type="button"
              >
                <span className="preset-dot" />
                <span className="preset-emoji">{preset.emoji}</span>
                {lang === 'zh' ? preset.name : preset.nameEn}
              </button>
            ))}
          </div>
          <div className="theme-mode">
            <button
              className={theme.mode === 'light' ? 'active' : ''}
              onClick={() => updateTheme({ mode: 'light' })}
              type="button"
            >
              <Sun size={15} />
              {t.light}
            </button>
            <button
              className={theme.mode === 'dark' ? 'active' : ''}
              onClick={() => updateTheme({ mode: 'dark' })}
              type="button"
            >
              <Moon size={15} />
              {t.dark}
            </button>
          </div>
          <label className="setting-row">
            <span>{t.accent}</span>
            <input
              onChange={(event) =>
                updateTheme({ accent: event.target.value, tint: event.target.value, preset: 'custom' })
              }
              type="color"
              value={theme.accent}
            />
          </label>
          <label className="setting-row">
            <span>{t.fontSize}</span>
            <input
              max="1.12"
              min="0.88"
              onChange={(event) => updateTheme({ fontScale: Number(event.target.value) })}
              step="0.04"
              type="range"
              value={theme.fontScale}
            />
          </label>
          <div className="setting-row">
            <span>
              <Languages size={14} /> {t.language}
            </span>
            <div className="segmented inline">
              <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLang('zh')} type="button">
                中文
              </button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} type="button">
                EN
              </button>
            </div>
          </div>
          <button className={view.pinned ? 'pin-toggle active' : 'pin-toggle'} onClick={togglePin} type="button">
            <Pin size={15} />
            <span>{t.pinOnTop}</span>
            <span className="pin-state">{view.pinned ? 'ON' : 'OFF'}</span>
          </button>
        </section>
      )}
    </aside>
  )
}

function WeeklyHistoryList({
  compact = false,
  emptyText,
  lang,
  onDelete,
  onStatusChange,
  t,
  weeks,
}: {
  compact?: boolean
  emptyText: string
  lang: Lang
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  t: Strings
  weeks: WeekGroup[]
}) {
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(
    () => new Set(weeks[0] ? [weeks[0].key] : []),
  )

  const toggleWeek = (key: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (weeks.length === 0) {
    return <p className="empty">{emptyText}</p>
  }

  return (
    <div className={compact ? 'weekly-history compact' : 'weekly-history'}>
      {weeks.map((week) => {
        const open = openWeeks.has(week.key)
        return (
          <div className="folder week-folder" key={week.key}>
            <button className="folder-head history-week-head" onClick={() => toggleWeek(week.key)} type="button">
              <ChevronRight className={open ? 'chev open' : 'chev'} size={14} />
              <Folder size={15} />
              <span className="folder-name">{week.label}</span>
              <small>
                {week.tasks.length}
                {t.taskUnit}
              </small>
            </button>
            {open && (
              <div className="folder-body week-days">
                {week.days.map((day) => {
                  const dayTodoCount = day.tasks.filter((task) => task.status === 'todo').length
                  return (
                    <section className="day-group" key={day.key}>
                      <div className="day-head">
                        <span>{day.label}</span>
                        <small>
                          {day.tasks.length}
                          {t.taskUnit}
                          {dayTodoCount > 0 ? ` · ${dayTodoCount} ${t.todo}` : ''}
                        </small>
                      </div>
                      <TaskList
                        compact
                        emptyText={t.emptyTask}
                        lang={lang}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        tasks={day.tasks}
                      />
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TaskList({
  compact = false,
  emptyText,
  lang,
  onDelete,
  onStatusChange,
  tasks,
}: {
  compact?: boolean
  emptyText?: string
  lang: Lang
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  tasks: Task[]
}) {
  if (tasks.length === 0) {
    return <p className="empty">{emptyText || (lang === 'zh' ? '暂无任务。' : 'No tasks.')}</p>
  }

  return (
    <div className={compact ? 'task-list compact' : 'task-list'}>
      {tasks.map((task) => (
        <article className={`task-row ${task.status}`} key={task.id}>
          <button
            className="status-button"
            onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
            title={task.status === 'done' ? (lang === 'zh' ? '标为未完成' : 'Mark to-do') : lang === 'zh' ? '标为已完成' : 'Mark done'}
            type="button"
          >
            {task.status === 'done' ? <Check size={17} /> : <Circle size={17} />}
          </button>
          <div className="task-text">
            <strong>{task.title}</strong>
            {task.note && <small>{task.note}</small>}
          </div>
          <button
            className="delete-button"
            onClick={() => onDelete(task.id)}
            title={lang === 'zh' ? '删除' : 'Delete'}
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </article>
      ))}
    </div>
  )
}

export default App
