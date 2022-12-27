# ::PACKAGE_NAME::

This is a tiny react module. It has been pre-configured with `jest` and `webpack`, so you can build and ship this module as a standalone package to `npm` or any other package manager of your choice.

The rest of this README assumes you're using `npm` and have already set up an organization / scope on your local env [npm - about scopes](https://docs.npmjs.com/about-scopes).

## Building and Publishing

Use `npm` to publish your module after running `npm build`.

```
$ npm run build && npm publish
```

Use `npm` to semver your module

```
$ npm version minor && npm run build && npm publish
```

## Usage

Installing this module from `npm`

```
$ npm i ::PACKAGE_NAME::
```
