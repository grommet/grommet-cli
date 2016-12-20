import chalk from 'chalk';
import table from 'text-table';

export function formatTotal(results) {
  const total = results.errorCount + results.warningCount;
  const problemLabel = total && total > 1 ? 'problems' : 'problem';
  const errorLabel = total && total > 1 ? 'erorrs' : 'error';
  const warningLabel = total && total > 1 ? 'warning' : 'warning';
  return chalk.red.bold(
    `\u2716 ${total} ${problemLabel} (${results.errorCount} ${errorLabel}, ${results.warningCount} ${warningLabel})\n`
  );
}

export function formatResults(results) {

  let output = '\n';

  results.forEach(result => {
    const messages = result.messages;

    if (messages.length === 0) {
      return;
    }

    output += `${chalk.underline(result.filePath)}\n`;

    output += `${table(
      messages.map(message => {
        let messageType;

        if (message.fatal || message.severity === 2) {
          messageType = chalk.red('error');
        } else {
          messageType = chalk.yellow('warning');
        }

        return [
          '',
          message.line || 0,
          message.column || 0,
          messageType,
          message.message.replace(/\.$/, ''),
          chalk.dim(message.ruleId || '')
        ];
      }),
      {
        align: ['', 'r', 'l'],
        stringLength(str) {
          return chalk.stripColor(str).length;
        }
      }
    ).split('\n').map(el => el.replace(/(\d+)\s+(\d+)/, (m, p1, p2) => chalk.dim(`${p1}:${p2}`))).join('\n')}\n\n`;
  });

  return output;
};

export default { formatResults, formatTotal };
