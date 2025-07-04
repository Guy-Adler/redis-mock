/*!
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { Lua } from 'lua.vm.js';

// Load the Lua marshalling interface

const INTERFACE = /* lua */ `
  -- Mimic Lua pairs for JS objects
  function js.pairs(value)
      local keys = js.global.Object:keys(value)
      local i = 0
      return function()
          -- Lua treats numeric keys as actually numeric
          local key = tonumber(keys[i]) or keys[i]
          i = i + 1
          return key, value[key]
      end
  end

  -- Marshal a value to JS from Lua
  function js.from(...)
      local value = ...
      if type(value) == 'table' then
          -- Treat tables with numeric keys as arrays, string keys as objects
          value = value[1] ~= nil and js.global:Array() or js.global:Object()
          for key, val in pairs(...) do
              -- Convert from Lua's 1-indexing to JS's 0-indexing
              if type(key) == 'number' then
                  key = key - 1
              end
              -- Recursively marshal values
              value[key] = js.from(val)
          end
      end
      -- Continue processing further arguments
      if value ~= nil then
          return value, js.from(select(2, ...))
      end
  end

  -- Marshal a value from JS to Lua
  function js.to(...)
      local value = ...
      if js.global.Object:is(js.null, value) then
          -- Convert null values to the null constant
          -- to allow for strict userdata comparison
          value = js.null
      elseif type(value) == 'userdata' then
          -- Treat non-null userdata (JS objects) as tables
          value = {}
          for key, val in js.pairs(...) do
              -- Convert from JS's 0-indexing to Lua's 1-indexing
              if type(key) == 'number' then
                  key = key + 1
              end
              -- Recursively marshal values
              value[key] = js.to(val)
          end
      end
      -- Continue processing further arguments
      if value ~= nil then
          return value, js.to(select(2, ...))
      end
  end

  -- Marshal a function call between JS and Lua
  function js.call(fn, ...)
      -- Use pcall to catch thrown values for special handling
      local single, result = pcall(fn, js.from(...))
      if single then
          -- If the function did not throw, return its result
          return js.to(result)
      elseif js.global.Array:isArray(result) then
          -- If the function threw an array, unpack it as a multi-return
          return unpack(js.to(result))
      else
          -- If the function threw anything else, stringify it as an error
          error(js.global:String(result))
      end
  end
`;

export class VM {
  private readonly lua: any;

  // Create a new Lua VM instance
  constructor() {
    this.lua = new Lua.State();
    this.lua.execute(INTERFACE);
  }

  // Run a script on this Lua interop instance
  run(script: string, ...args: any[]): any[] {
    // Execute the script and convert the results to their JS equivalent
    return this.lua.execute(/* lua */ `return js.from(...)`, ...this.lua.execute(script, ...args));
  }

  // Set a global key on this Lua interop instance
  set(key: string, value: any, proxy?: any) {
    this.lua._G.set(key, proxy ? this.proxy(value, proxy) : this.value(value));
  }

  // If a proxy is provided, generate a Lua object with the shape of the proxy
  private proxy(value: any, proxy: any) {
    const members = Object.entries(proxy).map(([key, value]) =>
      typeof value === 'function'
        ? // Method calls are marshalled with the given value as 'this'
          // (for non-bound functions, lua.vm.js passes the first
          // function argument to JS as 'this')
          /* lua */ `${key} = function (...) return js.call(__proxy.${key}, __value, ...) end`
        : // Constants are just converted directly to their equivalent
          /* lua */ `${key} = js.to(__proxy.${key})`
    );

    // Pass the value and proxy as local arguments which will be bound into
    // the returned Lua object
    return this.lua.execute(
      /* lua */ `local __proxy, __value = ...; return {${members.join(',')}}`,
      proxy,
      value
    )[0];
  }

  // If a proxy is not provided, just convert the value directly to Lua
  private value(value: any) {
    return this.lua.execute(/* lua */ `return js.to(...)`, value)[0];
  }
}

// Simulate Lua multi-return via unpacking the thrown array in js.call
export function returns(...values: any[]) {
  throw values;
}

// JS undefined is translated to Lua nil; alias for clarity
export const nil = undefined;
