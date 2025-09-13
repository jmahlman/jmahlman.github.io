function hasTypes(markdown) {
  return /## Type of change/.test(markdown) && /-\s\[x\]/i.test(markdown);
}

function hasDescription(markdown) {
  return (
    /## Description/.test(markdown) &&
    !/## Description\s*\n\s*(##|\s*$)/.test(markdown)
  );
}

export default async ({ github, context, core }) => {
  const pr = context.payload.pull_request;
  const body = pr.body === null ? '' : pr.body;
  // Remove all HTML comments (including overlapping/nested), multi-pass
  let markdown = body;
  let previousMarkdown;
  do {
    previousMarkdown = markdown;
    markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');
  } while (markdown !== previousMarkdown);
  const action = context.payload.action;

  const isValid =
    markdown !== '' && hasTypes(markdown) && hasDescription(markdown);

  if (!isValid) {
    await github.rest.pulls.update({
      ...context.repo,
      pull_number: pr.number,
      state: 'closed'
    });

    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: pr.number,
      body: `Oops, it seems you've ${action} an invalid pull request. No worries, we'll close it for you.`
    });

    core.setFailed('PR content does not meet template requirements.');
  }
};
