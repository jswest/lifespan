import "dotenv/config";
import { createHash } from "crypto";
import { unlinkSync, writeFileSync } from "fs";
import puppeteer from "puppeteer";
import { v4 as uuid } from "uuid";

import { config, getCommitHash, getLogger, slugify } from "./util.js";

export default class Bench {
	#logger;

	#channels;

	#actionCount = 0;
	#baseSourcePath = `temp/temp`;

	#browser;
	#page;

	#height;
	#width;
	#userAgent;

	#id;

	constructor({ channels, userAgent, viewport } = {}) {
		// Initialize the logger.
		this.#logger = getLogger({ name: "bench" });

		if (!Array.isArray(channels) || channels.length === 0) {
			const error = "You must pass an array of channels to Bench!";
			this.#logger.error(error);
			throw new Error(error);
		}
		this.#channels = channels;

		// Get the viewport size for the Puppeteer browser.
		const { height, width } = viewport ? viewport : config.viewport;
		this.#height = height;
		this.#width = width;

		// Get the userAgent string for the Puppeteer browser.
		this.#userAgent = userAgent ? userAgent : config.userAgent;

		// Name this instance of Bench.
		const timestamp = new Date(Date.now()).toISOString();
		this.#id = createHash("md5")
			.update(`${timestamp}_${uuid()}`)
			.digest("hex");

		// Log readiness.
		this.#logger.info(`Bench instance created with id "${this.#id}".`);
	}

	async prepare() {
		try {
			if (!this.#browser || !this.#page) {
				this.#browser = await puppeteer.launch({ headless: "new" });
				this.#page = await this.#browser.newPage();
				await this.#page.setViewport({
					height: this.#height,
					width: this.#width,
				});
				this.#logger.info("Browser and page created.");
			}
		} catch (error) {
			this.#logger.error(`Could not prepare: ${error}!`);
			await this.cleanup();
		}
	}

	async cleanup() {
		try {
			if (this.#browser) {
				await this.#browser.close();
			}
			unlinkSync(`${this.#baseSourcePath}.jpg`);
			unlinkSync(`${this.#baseSourcePath}.json`);
			unlinkSync(`${this.#baseSourcePath}.txt`);
		} catch (error) {
			this.#logger.error(`Could not clean up: ${error}!`);
		}
	}

	async act({ action, details, scrape } = {}) {
		await this.prepare();
		if (!action || action == "goto") {
			const url = details?.url;
			const wait = details?.wait || config.wait;

			if (!url) {
				throw new Error('No URL passed for "goto" action!');
				return;
			}

			try {
				this.#logger.info(`Begun goto action for "${url}".`);
				const start = Date.now();
				// Navigate to the url and wait for idle network.
				await this.#page.goto(url, { waitUntil: "networkidle2" });

				// Wait a bit longer.
				await this.#page.waitForTimeout(wait);

				// Scrape if required.
				if (scrape) {
					// For saving everything.
					const name = `${this.#id}_${this.#actionCount}`;

					// Metadata.
					const userAgent = await this.#browser.userAgent();
					const scrapedUrl = await this.#page.url();
					const commitHash = await getCommitHash({ logger: this.#logger });
					const metadata = {
						action_count: this.#actionCount,
						bench_id: this.#id,
						git_commit_hash: commitHash,
						scraped_at: new Date(Date.now()).toISOString(),
						url: {
							requested_url: url,
							scraped_url: scrapedUrl,
						},
						viewport: {
							height: this.#height,
							width: this.#width,
						},
						wait,
					};
					writeFileSync(
						`./${this.#baseSourcePath}.json`,
						JSON.stringify(metadata, null, 2),
					);

					// Screenshot.
					await this.#page.screenshot({
						fullPage: true,
						path: `./${this.#baseSourcePath}.jpg`,
					});

					// HTML.
					const html = await this.#page.content();
					writeFileSync(`./${this.#baseSourcePath}.txt`, html);
					this.#logger.info(`Scrape completed at ${name}.`);

					for (const channel of this.#channels) {
						await channel.put({
							source: `${this.#baseSourcePath}.json`,
							target: `scrapes/${name}.json`,
						});
						await channel.put({
							source: `${this.#baseSourcePath}.jpg`,
							target: `scrapes/${name}.jpg`,
						});
						await channel.put({
							source: `${this.#baseSourcePath}.txt`,
							target: `scrapes/${name}.txt`,
						});
					}
				}
				const end = Date.now();
				this.#logger.info(
					`Completed goto action for "${url}" after ${end - start}ms.`,
				);
			} catch (error) {
				this.#logger.error(`Could not goto page: ${error}!`);
				await this.cleanup();
			} finally {
				this.#actionCount++;
			}
		}
	}
}
