// this is Hack because I don't want modify ssr*-spec.js files

const Vue = global.Vue
const createRenderer = global.createRenderer

export { createRenderer }
export default Vue
