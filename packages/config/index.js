// ESLint Configurations
exports.eslint = {
  base: require('./eslint/base'),
  next: require('./eslint/next'),
  nest: require('./eslint/nest'),
};

// Prettier Configuration
exports.prettier = require('./prettier.config');

// TypeScript Configurations
exports.typescript = {
  base: require('./typescript/base'),
  next: require('./typescript/next'),
  nest: require('./typescript/nest'),
};