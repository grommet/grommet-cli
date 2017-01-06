/**
* NPM dependencies
**/
import Linter from 'eslint-parallel';

process.on('message', (assets) => {
  new Linter({
    cache: true,
    cwd: process.cwd()
  }).execute([assets]).then((result) => {
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
