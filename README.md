# @evenstephenr/bootstrapper

This package helps you quickly build and ship micro-frontends, microservices, and other federated modules

## Usage

Use `npx` to try this package out!

```
$ npx @evenstephenr/bootstrapper my-micro-module
```

By default, a `react` module that's fully configured with `jest` and `webpack` will be created. Check out the `./templates` directory in this project to see the templates.

You can use this base template to build a microfrontend or shared hook. I do this for my projects, and you can see some examples below

* [@evenstephenr/react-query](https://www.npmjs.com/package/@evenstephenr/react-query)
* [@evenstephenr/react-with-state](https://www.npmjs.com/package/@evenstephenr/react-with-state)

## Maintenance / updating this package

> NOTE: the templates for this package are currently being served through github assets. Because of this, we need strict semver policies so we don't break production. This can be fixed if we move the templates to a separate repo or remote location

`npm version major`
* Adding a new template (post-launch)

`npm version minor`
* Editing a template
* Any bugfix/hotfix that fixes blocked user actions or undesirable behavior

`npm version patch`
* all other changes
