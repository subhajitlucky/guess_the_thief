/**
 * Stable path alias — the brief for this phase names the icon set at
 * `client/components/icons/Icon.jsx`, while the app (and every other
 * component in the rebrand) imports it from `src/components/icons/Icon.jsx`.
 *
 * The implementation lives in src/, next to the rest of the component tree;
 * this file only re-exports it so both import specifiers resolve to the same
 * module instance.
 */
export { default } from '../../src/components/icons/Icon.jsx';
