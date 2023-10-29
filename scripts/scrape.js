import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import Bench from "./../lib/bench.js";
import { getLogger } from "./../lib/util.js";

const args = yargs(hideBin(process.argv))
	.option("url", {
		alias: "u",
		type: "string",
		description: "The URL of a website to scrape.",
	})
	.demandOption("url").argv;

const logger = getLogger({ name: "scrape" });

logger.info(`Preparing scrape of "${args.url}".`);

(async () => {
	try {
		const bench = new Bench();
		await bench.act({
			action: "goto",
			details: { url: args.url },
			scrape: true,
		});
		await bench.cleanup();
		logger.info(`Completed scrape of "${args.url}".`);
	} catch (error) {
		console.log("Oh no!", error);
	}
})();
