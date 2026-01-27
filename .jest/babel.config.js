// Babel configuration for Jest tests only
// Next.js uses SWC and should not use this config

module.exports = function (api) {
  // Only use Babel in test environment
  const isTest = api.env('test');
  
  if (!isTest) {
    // Return empty config for non-test environments
    return {};
  }

  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  };
};
