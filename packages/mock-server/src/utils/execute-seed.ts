import { Script, createContext } from 'vm'
import type { SeedContext } from './build-seed-context'

/**
 * Result of executing a seed handler.
 */
type SeedExecutionResult = {
  result: any
}

/**
 * Execute seed code in a sandboxed VM context.
 * The code is executed as an async IIFE with only the provided context
 * exposed in the sandbox. This avoids using the Function constructor.
 */
export async function executeSeed(code: string, context: SeedContext): Promise<SeedExecutionResult> {
  const wrapped = `(async (store, faker, seed, schema) => { \n${code}\n})(store, faker, seed, schema)`

  const sandbox: Record<string, unknown> = {
    store: context.store,
    faker: context.faker,
    seed: context.seed,
    schema: context.schema,
  }

  // Create an isolated VM context with a null prototype to reduce prototype pollution
  const vmContext = createContext(Object.create(null)) as any
  Object.assign(vmContext, sandbox)

  const script = new Script(wrapped, { filename: 'execute-seed.vm.js' })

  try {
    const result = script.runInContext(vmContext, { timeout: 1000 })

    if (result instanceof Promise) {
      return { result: await result }
    }

    return { result }
  } catch (error) {
    // Bubble up errors to the caller for logging/handling
    throw error
  }
}
