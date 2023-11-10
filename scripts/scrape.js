import "dotenv/config";
import { resolve } from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import Bench from "./../lib/bench.js";
import Channel from "./../lib/channel.js";
import Spider from "./../lib/spider.js";
import { getLogger } from "./../lib/util.js";

const userAgent = [
	"Mozilla/5.0",
	"(Macintosh; Intel Mac OS X 10.15; rv:109.0)",
	"Gecko/20100101",
	"Firefox/118.0",
].join(" ");

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
	.option("spider", {
		alias: "s",
		default: false,
		type: "boolean",
		description: "If the scraper should spider out from the main url.",
	})
	.option("scrapeId", {
		alias: "scrape-id",
		type: "integer",
		description: "The scrape id to use, rather than making an initial scrape.",
	})
	.option("localOnly", {
		alias: "local-only",
		type: "boolean",
		default: false,
		description: "If a spider should restrict itself to the node hostname.",
	})
	.demandOption("url").argv;

const logger = getLogger({ name: "scrape" });

(async () => {
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

	if (!args.spider) {
		logger.info(`Preparing scrape of "${args.url}".`);
		const bench = new Bench({ channels, userAgent });
		await bench.act({
			action: "goto",
			details: { url: args.url },
			scrape: true,
		});
		await bench.cleanup();
		logger.info(`Completed scrape of "${args.url}".`);
	} else {
		logger.info(`Preparing spider of "${args.url}".`);
		const spider = new Spider({
			channels,
			localOnly: args.localOnly,
			userAgent,
		});
		await spider.spin({
			scrapeId: args.scrapeId,
			url: args.url,
		});
		logger.info(`Completed spider of "${args.url}".`);
	}
})();
