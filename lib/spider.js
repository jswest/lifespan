import "dotenv/config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Bench from "./bench.js";
import * as cheerio from "cheerio";
import { readFileSync } from "fs";
import { parse } from "url";

import Scrape from "./../src/db/scrape.js";
import ScrapeSpider from "./../src/db/scrape-spider.js";
import Spider from "./../src/db/spider.js";
import { config, getLogger, sleep } from "./util.js";

export default class Spiderer {
	#bench;
	#caught = [];
	#client;
	#delay;
	#localOnly;
	#level;
	#logger;

	constructor({ channels, delay, localOnly, level, userAgent }) {
		this.#bench = new Bench({ channels, userAgent });
		this.#client = new S3Client({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
			region: "us-east-1",
		});
		this.#delay = delay || config.delay;
		this.#localOnly = localOnly;
		this.#level = level || 1;
		this.#logger = getLogger({ name: "spider" });
	}

	async #getLinks({ scrape }) {
		let html;
		const asset = scrape?.assets?.find((d) => d.channel_name === "s3");
		if (asset) {
			const response = await this.#client.send(
				new GetObjectCommand({
					Bucket: process.env.AWS_S3_BUCKET_NAME,
					Key: asset.html_location,
				}),
			);
			const buffer = await response.Body.toArray();
			html = buffer.join("");
		}
		
		const parsedUrl = parse(scrape.url_scraped);
		const hostname = parsedUrl.hostname;
		const protocol = parsedUrl.protocol;

		const $ = cheerio.load(html);

		const anchors = [];
		$("a").each((index, element) => {
			const href = $(element).attr("href");
			if (href && href[0] !== "#" && href.slice(0, 7) !== "mailto:") {
				if (href.slice(0, 4) === "http") {
					anchors.push(href);
				} else if (href[0] == "/") {
					anchors.push(`${protocol}//${hostname}${href}`);
				} else {
					if (scrape.url_scraped.slice(0, -1) === "/") {
						anchors.push(`${protocol}//${scrape.url_scraped}${href}`);
					} else {
						anchors.push(`${protocol}//${scrape.url_scraped}/${href}`);
					}
				}
			}
		});
		const links = [...new Set(anchors)];
		this.#logger.info(
			`There are ${links.length} links to scrape from this node.`,
		);
		return links;
	}

	async spin({ scrapeId, url }) {
		let links = [];
		if (scrapeId) {
			const scrapeRecord = await new Scrape({ id: scrapeId }).fetch();
			this.#caught.push(scrapeRecord.attributes.url_requested);
			this.#caught.push(scrapeRecord.attributes.url_scraped);
			links = await this.#getLinks({ scrape: scrapeRecord.attributes });
		} else {
			scrapeId = await this.#bench.act({
				action: "goto",
				details: { url: url },
				scrape: true,
			});
			const scrapeRecord = await new Scrape({ id: scrapeId }).fetch({
				withRelated: ["assets", "attempt"],
			});

			this.#caught.push(
				scrapeRecord.related("attempt").attributes.url_requested,
			);
			this.#caught.push(scrapeRecord.attributes.url_scraped);
			links = await this.#getLinks({ scrape: scrapeRecord.toJSON() });
		}

		const spiderRecord = Spider.forge({
			base_scrape_id: scrapeId,
			base_url: url,
			delay: this.#delay,
			ideal_length: links.length,
			is_local_only: this.#localOnly ? true : false,
			level: this.#level,
		});
		await spiderRecord.save();

		let index = 1;
		for (const link of links) {
			this.#logger.info(
				`Attempting scrape of link ${index} of ${links.length}.`,
			);
			if (!this.#caught.includes(link)) {
				this.#caught.push(link);
				this.#logger.info("Sleeping.");
				await sleep(this.#delay);
				this.#logger.info("Waking up.");
				try {
					const scrapeId = await this.#bench.act({
						action: "goto",
						cleanup: true,
						details: { url: link },
						scrape: true,
					});
					const scrapeRecord = await new Scrape({ id: scrapeId }).fetch({
						withRelated: ["assets", "attempt"],
					});
					this.#caught.push(scrapeRecord.attributes.url_scraped);
					if (scrapeRecord) {
						const scrapeSpiderRecord = ScrapeSpider.forge({
							scrape_id: scrapeRecord.attributes.id,
							spider_id: spiderRecord.attributes.id,
						});
						await scrapeSpiderRecord.save();
					}
				} catch (error) {
					this.#logger.error(`Could not scrape this record: ${error}!`);
				}
			}
			index++;
		}
		await this.#bench.cleanup();
	}
}
