/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-f0c192c2'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "index.html",
    "revision": "2517f926096492117f5855bf6f7b4556"
  }, {
    "url": "assets/vendor-react-odU-tHxv.js",
    "revision": null
  }, {
    "url": "assets/vendor-motion-Vunv0ZfJ.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-firestore-CfooEBjg.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-core-DR_B643V.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-auth-yFS-Hazv.js",
    "revision": null
  }, {
    "url": "assets/vendor-dexie-DhfNHsub.js",
    "revision": null
  }, {
    "url": "assets/vendor-charts-BHeL8L_D.js",
    "revision": null
  }, {
    "url": "assets/vendor-capacitor-C5p71nN7.js",
    "revision": null
  }, {
    "url": "assets/vendor-CVWyRRZB.js",
    "revision": null
  }, {
    "url": "assets/index-DGo-yyxY.js",
    "revision": null
  }, {
    "url": "assets/index-0SS8dXml.css",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "9be56bc007b9823c41513b2b83d178b7"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
