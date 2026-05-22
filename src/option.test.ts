import { strict as assert } from 'node:assert'
import test, { suite } from 'node:test'
import {
  makeSome,
  match,
  none,
  type None,
  type Option,
  type Some,
} from './core.js'
import { filter, flatMap, isNone, isSome, map, sequence } from './utilities.js'

suite('core', _ => {
  suite('none', _ => {
    test('is a None', _ => {
      assert(isNone(none))
    })

    test('has an undefined value', _ => {
      assert.equal(none.value, undefined)
    })
  })

  suite('makeSome', _ => {
    test('is a Some', _ => {
      assert(isSome(makeSome(1)))
    })

    test('accepts arbitrary values', _ => {
      assert.equal(makeSome(null).value, null)
      assert.equal(makeSome(undefined).value, undefined)
      assert.equal(makeSome(0).value, 0)
      assert.equal(makeSome(false).value, false)
      assert.deepEqual(makeSome({ a: 1 }).value, { a: 1 })
      assert.deepEqual(makeSome([]).value, [])
      assert.deepEqual(
        makeSome(makeSome('nesting is fine')).value,
        makeSome('nesting is fine'),
      )
      assert.deepEqual(makeSome(none).value, none)
    })
  })

  suite('match', _ => {
    test('calls the none branch for a None', _ => {
      let observedSome = false
      const result = match(none, {
        none: value => {
          assert.equal(value, undefined)
          return 'it works'
        },
        some: _ => {
          observedSome = true
          return 'wrong branch'
        },
      })
      assert.equal(result, 'it works')
      assert.equal(observedSome, false)
    })

    test('calls the some branch for a Some', _ => {
      let observedNone = false
      const result = match(makeSome(7), {
        none: _ => {
          observedNone = true
          return 'wrong branch'
        },
        some: value => `was some: ${value}`,
      })
      assert.equal(result, 'was some: 7')
      assert.equal(observedNone, false)
    })
  })
})

suite('utilities', _ => {
  suite('filter', _ => {
    const isNumber = (value: unknown) => typeof value === 'number'

    test('keeps a Some when the predicate is satisfied', _ => {
      const result: Option<number> = filter(
        makeSome<number | string>(42),
        isNumber,
      )
      assert.deepEqual(result, makeSome(42))
    })

    test('returns a None when the predicate is not satisfied', _ => {
      const result: Option<number> = filter(
        makeSome<number | string>('x'),
        isNumber,
      )
      assert.deepEqual(result, none)
    })

    test('returns a None when the input is a None', _ => {
      const result: Option<number> = filter(none, isNumber)
      assert.equal(result, none)
    })

    test('does not call the predicate when the input is a None', _ => {
      let calls = 0
      const numberNone = ((): Option<number> => none)()
      filter(numberNone, (value: unknown) => {
        calls += 1
        return typeof value === 'number'
      })
      assert.equal(calls, 0)
    })

    test('passes the wrapped value to the predicate', _ => {
      let received: unknown
      const option: Option<number> = makeSome(42)
      filter(option, (value: unknown) => {
        received = value
        return typeof value === 'number'
      })
      assert.equal(received, 42)
    })
  })

  suite('flatMap', _ => {
    test('applies the function to a Some value', _ => {
      const result = flatMap(makeSome(2), value => makeSome(value * 10))
      assert.deepEqual(result, makeSome(20))
    })

    test('allows the function to switch a Some into a None', _ => {
      const result = flatMap(makeSome(2), _ => none)
      assert.equal(result, none)
    })

    test('does not call the function when the input is None', _ => {
      let called = false
      const result = flatMap(none, _value => {
        called = true
        return makeSome('value')
      })
      assert.equal(called, false)
      assert.deepEqual(result, none)
    })

    test('supports changing the value type', _ => {
      const result = flatMap(makeSome(5), value => makeSome(`number: ${value}`))
      assert.deepEqual(result, makeSome('number: 5'))
    })
  })

  suite('isNone', _ => {
    test('returns true for None values', _ => {
      assert.equal(isNone(none), true)
    })

    test('returns false for Some values', _ => {
      assert.equal(isNone(makeSome(1)), false)
      assert.equal(isNone(makeSome(undefined)), false)
      assert.equal(isNone(makeSome(null)), false)
    })

    test('narrows the type to None', _ => {
      const option = ((): Option<string> => none)()
      if (isNone(option)) {
        option satisfies None
        assert.deepEqual(option, none)
      } else {
        assert.fail('expected Left')
      }
    })
  })

  suite('isSome', _ => {
    test('returns true for Some values', _ => {
      assert.equal(isSome(makeSome(1)), true)
      assert.equal(isSome(makeSome(undefined)), true)
      assert.equal(isSome(makeSome(null)), true)
    })

    test('returns false for None values', _ => {
      assert.equal(isSome(none), false)
    })

    test('narrows the type to Some', _ => {
      const option = ((): Option<string> => makeSome('hello'))()
      if (isSome(option)) {
        option satisfies Some<string>
        assert.deepEqual(option, makeSome('hello'))
      } else {
        assert.fail('expected Left')
      }
    })
  })

  suite('map', _ => {
    test('transforms the value within a Some', _ => {
      const result = map(makeSome(4), value => `schfifty ${value + 1}`)
      assert.deepEqual(result, makeSome('schfifty 5'))
    })

    test('returns a None when the input is a None', _ => {
      const result = map(none, value => (value ? 1 : 2))
      assert.equal(result, none)
    })

    test('does not call the function when the input is a None', _ => {
      let called = false
      map(none, _value => {
        called = true
      })
      assert.equal(called, false)
    })

    test('passes the wrapped value to the function', _ => {
      let received: unknown
      map(makeSome('hi'), value => {
        received = value
        return value
      })
      assert.equal(received, 'hi')
    })

    test('can map a Some to an undefined value', _ => {
      const result = map(makeSome(1), _ => undefined)
      assert.deepEqual(result, makeSome(undefined))
    })
  })

  suite('sequence', _ => {
    test('returns Some of an empty array when given no inputs', _ => {
      const result = sequence([])
      assert.deepEqual(result, makeSome([]))
    })

    test('returns a Some containing all values when every input is a Some', _ => {
      const result = sequence([makeSome(1), makeSome(2), makeSome(3)])
      assert.deepEqual(result, makeSome([1, 2, 3]))
    })

    test('supports a single Some', _ => {
      const result = sequence([makeSome(42)])
      assert.deepEqual(result, makeSome([42]))
    })

    test('supports a single None', _ => {
      const result = sequence([none])
      assert.deepEqual(result, none)
    })

    test('returns a None when the first input is a None', _ => {
      const result = sequence([none, makeSome(2), makeSome(3)])
      assert.deepEqual(result, none)
    })

    test('returns a None when the last input is a None', _ => {
      const result = sequence([makeSome(1), makeSome(2), none])
      assert.deepEqual(result, none)
    })

    test('returns a None when multiple inputs are Nones', _ => {
      const result = sequence([makeSome(1), none, none, makeSome(2)])
      assert.deepEqual(result, none)
    })

    test('preserves undefined Some values', _ => {
      const result = sequence([makeSome(undefined), makeSome(1)])
      assert.deepEqual(result, makeSome([undefined, 1]))
    })

    test('supports mixed types', _ => {
      // This test case is mostly about capturing type-level behavior.
      type ComplicatedInput =
        | [Some<41>, Option<string>, None]
        | [Some<42 | 43>, Option<44> | Option<45>]
        | [Option<number>, Option<string>]
        | []
      const inputs = ((): ComplicatedInput => [
        makeSome(45),
        makeSome('forty-six'),
      ])()
      const result: Option<[] | [42 | 43, 44 | 45] | [number, string]> =
        sequence(inputs)
      assert.deepEqual(result, makeSome([45, 'forty-six']))
    })
  })
})
