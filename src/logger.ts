import { getServiceContainer } from "@getflywheel/local/main";

const { localLogger } = getServiceContainer().cradle;

/**
 * An InstantReload scoped child logger
 */
const log = localLogger.child({
	addon: 'InstantReload',
});

export default log;
