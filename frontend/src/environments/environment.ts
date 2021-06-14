// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  authenticationUrl: "http://localhost:4050/auth/",
  usersUrl: "http://localhost:4050/users",
  contactsUrl: "http://localhost:4050/contacts",
  requestUrl: "http://localhost:4050/requests",
  postsUrl: "http://localhost:4050/posts",
  filesUrl: "http://localhost:4050/files",
  conversationsUrl: "http://localhost:4050/conversations",
  linksUrl: "http://localhost:4050/links",
  callUrl: "http://localhost:4050/calls",
  socketUrl: 'ws://localhost:4051',
  reconnectInterval: 2000,
  // authenticationUrl: "https://api.social-network.fullstackengineers.co.in/auth/",
  // usersUrl: "https://api.social-network.fullstackengineers.co.in/users",
  // contactsUrl: "https://api.social-network.fullstackengineers.co.in/contacts",
  // requestUrl: "https://api.social-network.fullstackengineers.co.in/requests",
  // postsUrl: "https://api.social-network.fullstackengineers.co.in/posts",
  // filesUrl: "https://api.social-network.fullstackengineers.co.in/files",
  // conversationsUrl: "https://api.social-network.fullstackengineers.co.in/conversations",
  // linksUrl: "https://api.social-network.fullstackengineers.co.in/links",
  // callUrl: "https://api.social-network.fullstackengineers.co.in/calls",
  // socketUrl: 'wss://ws.social-network.fullstackengineers.co.in',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
