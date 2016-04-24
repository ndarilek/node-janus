# 0.3.0

 * Rewrote tests in Jasmine and vastly expanded coverage.
 * Add `start` parameter to new sessions to determine whether they start polling on creation.
 * `Session.prototype.poll()` is now public and starts polling if the `Session` was created stopped.
 * Janus errors now emit `error` events to `Session`.
 * All media events now include the entire Janus payload.
 * Added additional error-handling.
 * Make `Session.prototype.id` a public, read-only property.

# V0.2.5 (2016-04-18)

 * Turns out React Native doesn't like us trying to set up isomorphic-fetch, so now this is the user's responsibility.

# V0.2.4 (2016-04-18)

 * Correctly set up `fetch` global by importing `isomorphic-fetch` for side-effects.

# V0.2.3 (2016-04-15)

 * postinstall script no longer expects typings to be installed.

# V0.2.2 (2016-04-15)

 * Track destroying/destroyed status of sessions and guard against double destroying.
 * Don't allow attaching handles to destroying/destroyed sessions.

# V0.2.1 (2016-04-15)

 * Remove runtime typechecking as it interferes with statics properties.
 * Add additional typechecks.

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
