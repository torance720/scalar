import { runInNewContext } from 'node:vm'

type SandboxOptions = {
  code: string
  store: Record<string, (...args: any[]) => unknown>
  jsonGlobals?: Record<string, unknown>
  includeSeed?: boolean
}

/** Execute mock code with a restricted set of globals and no dynamic code generation. */
export async function runInSandbox({ code, store, jsonGlobals = {}, includeSeed = false }: SandboxOptions) {
  const { faker } = await import('@faker-js/faker')
  const bridge = (kind: 'store' | 'faker', path: string[], args: string) => {
    if (path.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) {
      throw new Error('Unsupported sandbox bridge path')
    }
    const root: any = kind === 'store' ? store : faker
    const parts = kind === 'store' ? path : path.slice(0, -1)
    const key = kind === 'store' ? path[0] : path.at(-1)
    let owner = root
    for (const part of parts) owner = owner?.[part]
    const value = key === undefined ? owner : owner?.[key]
    const result = typeof value === 'function' ? value.apply(owner, JSON.parse(args)) : value
    return JSON.stringify(result === undefined ? null : result)
  }

  const globals = Object.fromEntries(
    Object.entries(jsonGlobals).map(([key, value]) => [key, JSON.parse(JSON.stringify(value))]),
  )
  const bootstrap = `
    (() => {
      const call = globalThis.__bridge
      delete globalThis.__bridge
      Object.assign(globalThis, JSON.parse(globalThis.__globals))
      delete globalThis.__globals
      const invoke = (kind, path, args) => JSON.parse(call(kind, path, JSON.stringify(args)))
      const store = Object.fromEntries(['list', 'get', 'create', 'update', 'delete', 'clear'].map((key) => [key, (...args) => invoke('store', [key], args)]))
      const faker = new Proxy({}, { get: (_, key) => new Proxy(function () {}, {
        get: (__, child) => (...args) => invoke('faker', [String(key), String(child)], args),
        apply: (_, __, args) => invoke('faker', [String(key)], args),
      }) })
      globalThis.store = store
      globalThis.faker = faker
      ${includeSeed ? `globalThis.seed = (arg, factory) => {
        if (typeof arg === 'number') return Array.from({ length: arg }, () => store.create(schema, factory()))
        if (Array.isArray(arg)) return arg.map((item) => store.create(schema, item))
        if (typeof arg === 'function') return store.create(schema, arg())
        throw new Error('Invalid seed() usage')
      }; globalThis.seed.count = (n, factory) => Array.from({ length: n }, () => store.create(schema, factory()))` : ''}
    })()
  `
  const context = { __bridge: bridge, __globals: JSON.stringify(globals) }
  const result = runInNewContext(`${bootstrap}\n(async () => { ${code}\n })()`, context, {
    timeout: 1000,
    microtaskMode: 'afterEvaluate',
    contextCodeGeneration: { strings: false, wasm: false },
  })
  return await result
}

