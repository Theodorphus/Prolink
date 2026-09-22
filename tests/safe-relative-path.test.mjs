import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeRelativePath } from '../src/lib/safe-relative-path.mjs'

test('login redirects stay on the application origin after URL normalization', () => {
  const origin = 'https://prolink.example'
  for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', '/\t/evil.example', '/\n/evil.example', '/\r/evil.example', '/\0evil', null]) {
    assert.equal(safeRelativePath(value), '/')
    assert.equal(new URL(safeRelativePath(value), origin).origin, origin)
  }
  const path = '/jobs/create?category=design&title=Logo%20design'
  assert.equal(safeRelativePath(path), path)
})
