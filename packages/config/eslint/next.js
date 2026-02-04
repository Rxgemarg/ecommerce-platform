const baseConfig = require('./base');

module.exports = {
  ...baseConfig,
  env: {
    ...baseConfig.env,
    browser: true,
  },
  extends: [
    ...baseConfig.extends,
    'next/core-web-vitals',
  ],
  rules: {
    ...baseConfig.rules,
    // Next.js specific rules
    '@next/next/no-img-element': 'warn',
    '@next/next/no-html-link-for-pages': 'off', // We handle this differently
    
    // Additional rules for frontend
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};