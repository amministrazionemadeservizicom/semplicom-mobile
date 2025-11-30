const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Configura proxy per evitare CORS in sviluppo
  if (config.devServer) {
    config.devServer.proxy = {
      '/api': {
        target: 'http://dev.ceposto.it:16732',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
    };
  }

  return config;
};
