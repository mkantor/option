import { optionTag } from '@matt.kantor/option-tag-symbol'

export type Option<Value> = None | Some<Value>

export type None = {
  readonly [optionTag]: 'none'
  readonly value: undefined
}

export type Some<Value> = {
  readonly [optionTag]: 'some'
  readonly value: Value
}

export const none: None = {
  [optionTag]: 'none',
  value: undefined,
}

export const makeSome = <const Value>(value: Value): Some<Value> => ({
  [optionTag]: 'some',
  value,
})

export const match = <const Value, NoneResult, SomeResult>(
  adt: Option<Value>,
  cases: {
    readonly none: (value: undefined) => NoneResult
    readonly some: (value: Value) => SomeResult
  },
): NoneResult | SomeResult => {
  switch (adt[optionTag]) {
    case 'none':
      return cases[adt[optionTag]](adt.value)
    case 'some':
      return cases[adt[optionTag]](adt.value)
  }
}
