/**
 * @type {import("prettier").Config}
 * Need to restart IDE when changing configuration
 * Open the command palette (Ctrl + Shift + P) and execute the command > Reload Window.
 */
// config will apply changes to semi colons to true, tab width to 2, end of line to lf, print width to 100, single quotes to true, and trailing commas to es5
const config = {
    semi: true,
    tabWidth: 2,
    endOfLine: 'lf',
    printWidth: 100,
    singleQuote: true,
    trailingComma: 'es5',
  };
  
  export default config;
  