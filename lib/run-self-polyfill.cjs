'use strict';
/** Runs before Next build/start so server code that references 'self' sees global.self. */
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
}
