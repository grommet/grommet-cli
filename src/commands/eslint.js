/**
* NPM dependencies
**/
import Linter from 'eslint-parallel';
import yargs from 'yargs';

process.on('message', (assets) => {
  new Linter(Object.assign({
    cache: true,
    cwd: process.cwd()
  }, yargs(process.argv.slice(2)).argv)).execute([assets]).then((result) => {
    const failed = result.errorCount || result.warningCount;
    if (failed) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }, (err) => {
    console.log(err);
    process.exit(1);
  });
});
