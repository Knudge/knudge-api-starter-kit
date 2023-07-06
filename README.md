Knudge API starter kit
======================

Getting Started
---------------

1. Rename `.env.example` to `.env`
2. Replace missing environment variables with your own
3. Run `npm run start`. Note that you'll need to be an administrator on your
   computer to allow the `devcert` package to install certificates, which allows
   you to serve the local app over HTTPS.


Scripts
-------

- `start` runs your app for development, reloading on file changes
- `start:build` runs your app after it has been built using the build command
- `build` builds your app and outputs it in your `dist` directory
- `test` runs your test suite with Web Test Runner
- `lint` runs the linter for your project


Template
--------

Based on the [Open Web Components development generator][open-wc]

[open-wc]: https://open-wc.org/docs/development/generator/
