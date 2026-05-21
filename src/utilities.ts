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

/**
 * Transform an array of `Option`s into a `Some` containing an array, or a
 * `None` if any of the `options` are `None`.
 */
export const sequence = <const Options extends readonly Option<unknown>[]>(
  options: Options,
): SequenceOutput<Options> => {
  const [firstOption, ...remainingOptions] = options

  const returnValue =
    firstOption === undefined
      ? makeSome([])
      : remainingOptions.reduce<
          // Unfortunately TypeScript doesn't keep track of the specific value
          // types in the `Options` type parameter—instead it falls back to the
          // concrete constraint type.
          Option<readonly unknown[]>
        >(
          (combinedOption, currentOption) =>
            flatMap(combinedOption, combinedValue =>
              map(currentOption, currentValue => [
                ...combinedValue,
                currentValue,
              ]),
            ),
          map(firstOption, value => [value]),
        )

  // The above `reduce` callback is guaranteed to produce an `Option` whose
  // value is an array of the same length as `Options`, but that's not provable
  // in TypeScript's type system.
  return returnValue as SequenceOutput<Options>
}
type SequenceOutput<Options extends readonly Option<unknown>[]> = Option<
  ReduceNevers<{
    -readonly [Index in keyof Options]: ValueOf<Options[Index]>
  }>
> &
  unknown // Hide `SequenceOutput` from type info.

type ValueOf<SpecificOption extends Option<unknown>> =
  SpecificOption extends Some<infer Value> ? Value : never

/**
 * Convert uninhabited tuples to `never` (e.g. `[never]` becomes `never`).
 */
type ReduceNevers<Tuple extends readonly unknown[]> = Tuple extends Tuple // Distribute over unions.
  ? {
      [Index in keyof Tuple]: Tuple[Index] extends never ? unknown : never
    }[number] extends never
    ? Tuple
    : never
  : never
