const path = require('path');

module.exports = {
  entry: './build/legacy/sectionjs.js',
  output: {
    filename: 'sectionjs-legacy.js', // Nombre del archivo de salida modificado
    path: path.resolve(__dirname, 'build/webpack'), // Carpeta de salida modificada
    library: 'sectionjsCompat',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  mode: 'production',
  target: ['web', 'es5'],
};