import { useState, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * useToggle Hook
 *
 * Manages boolean state with convenient toggle, set, and unset functions.
 * Perfect for modals, dropdowns, checkboxes, and any on/off state.
 *
 * @param initialValue - Initial boolean value (default: false)
 * @returns Tuple of [value, toggle, setTrue, setFalse, setValue]
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const [isOpen, toggle, open, close] = useToggle(false);
 *
 *   return (
 *     <div>
 *       <button onClick={open}>Open Modal</button>
 *       {isOpen && (
 *         <div className="modal">
 *           <h2>Modal Content</h2>
 *           <button onClick={close}>Close</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * // For checkboxes
 * function Checkbox() {
 *   const [checked, toggle] = useToggle(false);
 *
 *   return (
 *     <input
 *       type="checkbox"
 *       checked={checked}
 *       onChange={toggle}
 *     />
 *   );
 * }
 *
 * @example
 * // For dropdowns
 * function Dropdown() {
 *   const [isOpen, toggle, open, close] = useToggle();
 *
 *   return (
 *     <div onMouseEnter={open} onMouseLeave={close}>
 *       <button onClick={toggle}>Toggle</button>
 *       {isOpen && <DropdownMenu />}
 *     </div>
 *   );
 * }
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse, setValue];
}

/**
 * useBoolean Hook
 *
 * Alias for useToggle with more descriptive method names.
 * Same functionality, different naming convention.
 *
 * @param initialValue - Initial boolean value
 * @returns Object with value and control methods
 *
 * @example
 * ```tsx
 * function LoadingButton() {
 *   const loading = useBoolean(false);
 *
 *   const handleClick = async () => {
 *     loading.on();
 *     try {
 *       await someAsyncOperation();
 *     } finally {
 *       loading.off();
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleClick} disabled={loading.value}>
 *       {loading.value ? 'Loading...' : 'Click Me'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBoolean(initialValue: boolean = false) {
  const [value, toggle, setTrue, setFalse, setValue] = useToggle(initialValue);

  return {
    value,
    toggle,
    on: setTrue,
    off: setFalse,
    setValue,
  };
}

/**
 * useCounter Hook
 *
 * Manages numeric state with increment, decrement, and reset functions.
 * Supports min/max bounds and custom step values.
 *
 * @param initialValue - Initial count value (default: 0)
 * @param options - Optional configuration
 * @returns Counter state and controls
 *
 * @example
 * ```tsx
 * function QuantitySelector() {
 *   const {
 *     count,
 *     increment,
 *     decrement,
 *     reset,
 *     setValue
 *   } = useCounter(1, { min: 1, max: 99 });
 *
 *   return (
 *     <div>
 *       <button onClick={decrement}>-</button>
 *       <span>{count}</span>
 *       <button onClick={increment}>+</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * // With step value
 * const counter = useCounter(0, { step: 5, min: 0, max: 100 });
 * <button onClick={counter.increment}>+5</button>
 */
export function useCounter(
  initialValue: number = 0,
  options: { min?: number; max?: number; step?: number } = {}
) {
  const { min, max, step = 1 } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((c) => {
      const newCount = c + step;
      if (max !== undefined) {
        return Math.min(newCount, max);
      }
      return newCount;
    });
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount((c) => {
      const newCount = c - step;
      if (min !== undefined) {
        return Math.max(newCount, min);
      }
      return newCount;
    });
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback(
    (value: number | ((prev: number) => number)) => {
      setCount((current) => {
        const newValue = typeof value === 'function' ? value(current) : value;
        if (min !== undefined && newValue < min) return min;
        if (max !== undefined && newValue > max) return max;
        return newValue;
      });
    },
    [min, max]
  );

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
  };
}

/**
 * useArray Hook
 *
 * Provides utility methods for array state management.
 * Includes push, remove, filter, update, and clear operations.
 *
 * @template T - Type of array elements
 * @param initialValue - Initial array value
 * @returns Array state and utility methods
 *
 * @example
 * ```tsx
 * function TodoList() {
 *   const {
 *     value: todos,
 *     push,
 *     remove,
 *     filter,
 *     update,
 *     clear
 *   } = useArray<Todo>([]);
 *
 *   const addTodo = (text: string) => {
 *     push({ id: Date.now(), text, completed: false });
 *   };
 *
 *   const toggleTodo = (id: number) => {
 *     update(id, (todo) => ({ ...todo, completed: !todo.completed }));
 *   };
 *
 *   return (
 *     <div>
 *       {todos.map(todo => (
 *         <TodoItem
 *           key={todo.id}
 *           todo={todo}
 *           onToggle={() => toggleTodo(todo.id)}
 *           onDelete={() => remove(todo.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArray<T>(initialValue: T[] = []) {
  const [value, setValue] = useState(initialValue);

  const push = useCallback((element: T) => {
    setValue((arr) => [...arr, element]);
  }, []);

  const remove = useCallback((index: number) => {
    setValue((arr) => arr.filter((_, i) => i !== index));
  }, []);

  const removeById = useCallback((id: any) => {
    setValue((arr) => arr.filter((item: any) => item.id !== id));
  }, []);

  const filter = useCallback((callback: (value: T, index: number, array: T[]) => boolean) => {
    setValue((arr) => arr.filter(callback));
  }, []);

  const update = useCallback((index: number, newElement: T | ((oldElement: T) => T)) => {
    setValue((arr) =>
      arr.map((item, i) => {
        if (i === index) {
          return typeof newElement === 'function'
            ? (newElement as (oldElement: T) => T)(item)
            : newElement;
        }
        return item;
      })
    );
  }, []);

  const updateById = useCallback((id: any, updater: (item: T) => T) => {
    setValue((arr) => arr.map((item: any) => (item.id === id ? updater(item) : item)));
  }, []);

  const clear = useCallback(() => {
    setValue([]);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue,
    push,
    remove,
    removeById,
    filter,
    update,
    updateById,
    clear,
    reset,
  };
}

/**
 * useSet Hook
 *
 * Manages Set data structure with convenient add/remove/toggle methods.
 * Useful for managing selections, tags, and unique collections.
 *
 * @template T - Type of Set elements
 * @param initialValue - Initial Set or array of values
 * @returns Set state and utility methods
 *
 * @example
 * ```tsx
 * function MultiSelect({ items }: { items: string[] }) {
 *   const {
 *     set: selected,
 *     add,
 *     remove,
 *     toggle,
 *     has,
 *     clear
 *   } = useSet<string>();
 *
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <button
 *           key={item}
 *           onClick={() => toggle(item)}
 *           className={has(item) ? 'selected' : ''}
 *         >
 *           {item}
 *         </button>
 *       ))}
 *       <p>Selected: {Array.from(selected).join(', ')}</p>
 *       <button onClick={clear}>Clear All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSet<T>(initialValue?: Set<T> | T[]) {
  const [set, setSet] = useState<Set<T>>(() => {
    if (initialValue instanceof Set) {
      return new Set(initialValue);
    }
    return new Set(initialValue);
  });

  const add = useCallback((value: T) => {
    setSet((prevSet) => new Set([...prevSet, value]));
  }, []);

  const remove = useCallback((value: T) => {
    setSet((prevSet) => {
      const newSet = new Set(prevSet);
      newSet.delete(value);
      return newSet;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet((prevSet) => {
      const newSet = new Set(prevSet);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  }, []);

  const has = useCallback((value: T) => set.has(value), [set]);

  const clear = useCallback(() => {
    setSet(new Set());
  }, []);

  const reset = useCallback(() => {
    setSet(new Set(initialValue));
  }, [initialValue]);

  return {
    set,
    add,
    remove,
    toggle,
    has,
    clear,
    reset,
    size: set.size,
  };
}
