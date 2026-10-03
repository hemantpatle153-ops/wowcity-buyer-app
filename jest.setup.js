/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));
