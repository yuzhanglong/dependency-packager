module.exports = {
  root: true,
  extends: '@attachments/eslint-config',
  rules: {
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'semi',
        requireLast: true
      },
      singleline: {
        delimiter: 'semi',
        requireLast: false
      }
    }],
  }
};
