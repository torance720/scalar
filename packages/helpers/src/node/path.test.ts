import { describe, expect, it } from 'vitest'

import { basename, dirname, extname, isAbsolute, join, normalize, relative, resolve } from './path'

describe('path utilities', () => {
  describe('resolve', () => {
    it('should resolve absolute paths', () => {
      expect(resolve('/foo/bar', './baz')).toBe('/foo/bar/baz')
      expect(resolve('/foo/bar', '/baz')).toBe('/baz')
    })

    it('should resolve relative paths', () => {
      expect(resolve('foo/baz', '../baz')).toBe('/foo/baz')
      expect(resolve('foo/bar', '../../baz')).toBe('/baz')
    })

    it('should throw for non-string arguments', () => {
      // @ts-expect-error test invalid runtime values
      expect(() => resolve('foo', null)).toThrow('Arguments to path.resolve must be strings')
    })
  })

  describe('normalize', () => {
    it('should normalize paths with . and ..', () => {
      expect(normalize('foo/./bar')).toBe('foo/bar')
      expect(normalize('foo/../bar')).toBe('bar')
      expect(normalize('foo//bar')).toBe('foo/bar')
    })

    it('should preserve trailing slashes', () => {
      expect(normalize('foo/')).toBe('foo/')
      expect(normalize('foo/bar/')).toBe('foo/bar/')
    })
  })

  describe('isAbsolute', () => {
    it('should identify absolute paths', () => {
      expect(isAbsolute('/foo/bar')).toBe(true)
      expect(isAbsolute('foo/bar')).toBe(false)
    })
  })

  describe('join', () => {
    it('should join path segments', () => {
      expect(join('foo', 'bar', 'baz')).toBe('foo/bar/baz')
      expect(join('/foo', 'bar', '/baz')).toBe('/foo/bar/baz')
    })

    it('should throw for non-string arguments', () => {
      // @ts-expect-error test invalid runtime values
      expect(() => join('foo', null)).toThrow('Arguments to path.join must be strings')
    })
  })

  describe('relative', () => {
    it('should compute relative paths', () => {
      expect(relative('/foo/bar', '/foo/baz')).toBe('../baz')
      expect(relative('/foo/bar/baz', '/foo/bar/qux')).toBe('../qux')
      expect(relative('/foo/bar', '/foo/bar')).toBe('')
    })
  })

  describe('dirname', () => {
    it('should return directory name', () => {
      expect(dirname('/foo/bar/baz')).toBe('/foo/bar')
      expect(dirname('/foo/bar/')).toBe('/foo')
      expect(dirname('foo/bar')).toBe('foo')
    })

    it('should handle edge cases', () => {
      expect(dirname('/')).toBe('/')
      expect(dirname('.')).toBe('.')
      expect(dirname('')).toBe('.')
    })
  })

  describe('basename', () => {
    it('should return base filename', () => {
      expect(basename('/foo/bar/baz.txt')).toBe('baz.txt')
      expect(basename('/foo/bar/baz')).toBe('baz')
      expect(basename('/foo/bar/')).toBe('bar')
    })

    it('should handle extensions', () => {
      expect(basename('/foo/bar/baz.txt', '.txt')).toBe('baz')
      expect(basename('baz.txt', '.txt')).toBe('baz')
    })

    it('should handle case-insensitive extension matches on Windows', () => {
      const originalOS = process.env.OS
      process.env.OS = 'Windows_NT'

      try {
        expect(basename('file.TS', '.ts')).toBe('file')
        expect(basename('file.Js', '.JS')).toBe('file')
      } finally {
        if (originalOS === undefined) delete process.env.OS
        else process.env.OS = originalOS
      }
    })

    it.runIf(process.platform !== 'win32')('should keep extension matching case-sensitive outside Windows', () => {
      const originalOS = process.env.OS
      delete process.env.OS

      try {
        expect(basename('file.TS', '.ts')).toBe('file.TS')
      } finally {
        if (originalOS !== undefined) process.env.OS = originalOS
      }
    })
  })

  describe('extname', () => {
    it('should return file extension', () => {
      expect(extname('foo.txt')).toBe('.txt')
      expect(extname('/foo/bar/baz.txt')).toBe('.txt')
      expect(extname('foo')).toBe('')
      expect(extname('.foo')).toBe('')
    })
  })
})
