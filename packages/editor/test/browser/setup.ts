import { afterEach } from 'vitest'
import { cleanup } from './render'
import './setup.css'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(async () => {
  await cleanup()
})
