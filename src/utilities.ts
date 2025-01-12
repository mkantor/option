import {
  makeSome,
  match,
  none,
  type None,
  type Option,
  type Some,
} from './core.js'

export const filter = <Value, NarrowedValue extends Value>(
  option: Option<Value>,
  predicate: (value: Value) => value is NarrowedValue,
): Option<NarrowedValue> =>
  flatMap(option, value => (predicate(value) ? makeSome(value) : none))

export const flatMap = <Value, NewValue>(
  option: Option<Value>,
  f: (value: Value) => Option<NewValue>,
): Option<NewValue> =>
  match(option, {
    none: _ => none,
    some: f,
  })

export const isNone = (option: Option<unknown>): option is None =>
  match(option, {
    none: _ => true,
    some: _ => false,
  })

export const isSome = (option: Option<unknown>): option is Some<unknown> =>
  match(option, {
    none: _ => false,
    some: _ => true,
  })

export const map = <Value, NewValue>(
  option: Option<Value>,
  f: (value: Value) => NewValue,
): Option<NewValue> =>
  match(option, {
    none: _ => none,
    some: value => makeSome(f(value)),
  })
