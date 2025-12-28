/* Test globals and module mocks for TypeScript */
import 'jest';

declare global {
  // Jest globals
  var describe: typeof describe;
  var it: typeof it;
  var expect: typeof expect;
  var beforeEach: typeof beforeEach;
  var afterEach: typeof afterEach;
}

// Allow importing .png in tests and components
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '@testing-library/react-native';
declare module '@testing-library/jest-native';

declare module 'jest-mock';
