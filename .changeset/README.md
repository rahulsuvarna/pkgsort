# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets),
which we use to version pkgsort and generate its [changelog](../CHANGELOG.md).

**Every user-facing change should ship with a changeset.** To add one:

```sh
npx changeset
```

Answer the prompts (which bump — patch / minor / major — and a short summary),
then commit the generated Markdown file alongside your change. Maintainers merge
these into releases; contributors never publish manually.

See the [Changesets documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
for details.
