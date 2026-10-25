// Entry point. Only the default handler is exported from the main module (Workers rule);
// worker.js holds the app and shares helpers with split.js.
import handler from './worker.js';
export default handler;
