import { Script, createContext } from 'vm'
import type { HandlerContext } from './build-handler-context'

/**
 * Result of executing a handler, including the result and operation tracking.
 */
type HandlerExecutionResult = {
  result: any
}

/**
 * Execute handler code in a sandboxed VM context.
 * The code is executed as an async IIFE with only the provided context
 * exposed in the sandbox. This avoids using the Function constructor.
 */
export async function executeHandler(code: string, context: HandlerContext): Promise<HandlerExecutionResult> {
  const wrapped = `(async (store, faker, req, res) => { \n${code}\n})(store, faker, req, res)`

  const sandbox: Record<string, unknown> = {
    store: context.store,
    faker: context.faker,
    req: context.req,
    res: context.res,
  }

  const vmContext = createContext(Object.create(null)) as any
  Object.assign(vmContext, sandbox)

  const script = new Script(wrapped, { filename: 'execute-handler.vm.js' })

  try {
    const result = script.runInContext(vmContext, { timeout: 1000 })

    if (result instanceof Promise) {
      return { result: await result }
    }

    return { result }
  } catch (error) {
    throw error
  }
}
