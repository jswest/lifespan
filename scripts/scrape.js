import "dotenv/config";
import { resolve } from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import Bench from "./../lib/bench.js";
import Channel from "./../lib/channel.js";
import { getLogger } from "./../lib/util.js";

const args = yargs(hideBin(process.argv))
	.option("url", {
		alias: "u",
		type: "string",
		description: "The URL of a website to scrape.",
	})
	.option("channels", {
		alias: "c",
		default: "s3",
		type: "string",
		description: "A comma separated list of channels to save scrapes to.",
	})
	.demandOption("url").argv;

const logger = getLogger({ name: "scrape" });

logger.info(`Preparing scrape of "${args.url}".`);

(async () => {
	try {
		const fs = new Channel({
			name: "fs",
			details: { root: resolve("./data") },
		});

		const s3 = new Channel({
			name: "s3",
			details: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				bucketName: process.env.AWS_S3_BUCKET_NAME,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
		});

		const valid = args.channels.split(",");
		const channels = [];
		for (const v of valid) {
			if (v === "fs") {
				channels.push(fs);
			} else if (v === "s3") {
				channels.push(s3);
			}
		}

		const bench = new Bench({ channels });
		await bench.act({
			action: "goto",
			details: { url: args.url },
			scrape: true,
		});
		await bench.cleanup();
		logger.info(`Completed scrape of "${args.url}".`);
	} catch (error) {
		logger.error(`Oh dear: ${error}!`);
	}
})();
