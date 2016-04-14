# V0.2.0 (2016-04-14)

 * Rewrite in TypeScript.
 * Remove need to set `Session.fetch`.

# V0.1.7 (2016-04-11)

 * Prefer `window.fetch` to `fetch`.

# V0.1.6 (2016-04-11)

 * If `window.fetch` is defined, set `Session.fetch` to its correctly-bound value.

# V0.1.5 (2016-04-06)

 * Clean up how sessions are destroyed.
 * Eliminate double-emit of "destroyed" event.

# V0.1.4 (2016-04-06)

 * Add lodash dependency.

# V0.1.3 (2016-04-06)

 * Set appropriate `Accept` and `Content-Type` headers.

# V0.1.2 (2016-04-06)

 * Somehow the `lib/` directory was excluded by Concourse. Fix.

# V0.1.1 (2016-04-06)

 * Add beginnings of a test suite.
 * Ignore .babelrc in published package.
 * Add various sanity checks for constructor.

# V0.1.0 (2016-04-04)

 * Initial release.
