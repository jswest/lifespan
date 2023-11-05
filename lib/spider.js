import "dotenv/config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Bench from "./bench.js";
import * as cheerio from "cheerio";
import { readFileSync } from "fs";
import Recorder from "./recorder.js";
import { parse } from "url";
import { config, getLogger, sleep } from "./util.js";

export default class Spider {
	#bench;
	#caught = [];
	#client;
	#delay;
	#isLocalOnly;
	#level;
	#logger;
	#recorder;

	constructor({ channels, delay, isLocalOnly, level, userAgent }) {
		this.#bench = new Bench({ channels, userAgent });
		this.#client = new S3Client({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
			region: "us-east-1",
		});
		this.#delay = delay || config.delay;
		this.#isLocalOnly = isLocalOnly;
		this.#level = level || 1;
		this.#logger = getLogger({ name: "spider" });
		this.#recorder = new Recorder();
	}

	async #getLinks({ scrape }) {
		let html;
		if (scrape.channel_name === "s3") {
			const response = await this.#client.send(
				new GetObjectCommand({
					Bucket: process.env.AWS_S3_BUCKET_NAME,
					Key: scrape.html_location,
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
			const scrape = await this.#recorder.getScrapeById({ id: scrapeId });
			this.#caught.push(scrape.url_requested);
			this.#caught.push(scrape.url_scraped);
			links = await this.#getLinks({ scrape });
		} else {
			const scrapeMetaRecord = await this.#bench.act({
				action: "goto",
				details: { url: url },
				scrape: true,
			});
			scrapeId = scrapeMetaRecord.id;
			const scrape = await this.#recorder.getScrapeById({
				id: scrapeId,
			});
			this.#caught.push(scrape.url_requested);
			this.#caught.push(scrape.url_scraped);
			links = await this.#getLinks({ scrape });
		}

		const spiderRecord = await this.#recorder.saveSpider({
			base_scrape_id: scrapeId,
			delay: this.#delay,
			ideal_length: links.length,
			is_local_only: this.#isLocalOnly ? true : false,
			level: this.#level,
			url_node: url,
		});

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
					const scrapeMetaRecord = await this.#bench.act({
						action: "goto",
						cleanup: true,
						details: { url: link },
						scrape: true,
					});
					this.#caught.push(scrapeMetaRecord.url_scraped);
					if (scrapeMetaRecord) {
						const scrapeSpiderRecord = await this.#recorder.saveScrapeSpider({
							scrape_id: scrapeMetaRecord.id,
							spider_id: spiderRecord.id,
						});
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
