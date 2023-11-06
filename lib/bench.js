import "dotenv/config";
import { createHash } from "crypto";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

import Recorder from "./recorder.js";
import { config, getCommitHash, getLogger, slugify } from "./util.js";

export default class Bench {
	#logger;
	#recorder;

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

		this.#recorder = new Recorder();

		// Log readiness.
		this.#logger.info(`Bench instance created with id "${this.#id}".`);
	}

	async prepare() {
		try {
			if (!this.#browser || !this.#page) {
				this.#browser = await puppeteer.launch({ headless: "new", executablePath: process.env.CHROMIUM_PATH });
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

	#removeFile(file) {
		if (existsSync(file)) {
			unlinkSync(file);
		}
	}

	async cleanup() {
		try {
			if (this.#browser) {
				await this.#browser.close();
				this.#browser = null;
				this.#page = null;
			}
			this.#removeFile(`${this.#baseSourcePath}-screenshot.jpg`);
			this.#removeFile(`${this.#baseSourcePath}.json`);
			this.#removeFile(`${this.#baseSourcePath}.txt`);
			this.#removeFile(`${this.#baseSourcePath}-thumbnail.jpg`);
		} catch (error) {
			this.#logger.error(`Could not clean up: ${error}!`);
		}
	}

	async act({ action, cleanup, details, scrape } = {}) {
		await this.prepare();
		if (!action || action == "goto") {
			const url = details?.url;
			const wait = details?.wait || config.wait;

			if (!url) {
				throw new Error('No URL passed for "goto" action!');
				return;
			}

			let result;

			this.#logger.info(`Begun goto action for "${url}".`);
			const start = Date.now();

			let success = true;

			try {
				if (this.#userAgent && this.#userAgent !== "default") {
					await this.#page.setUserAgent(this.#userAgent);
				}

				// Navigate to the url and wait for idle network.
				await this.#page.goto(url, { waitUntil: "networkidle2" });

				// Wait a bit longer.
				await this.#page.waitForTimeout(wait);
			} catch (error) {
				this.#logger.error(`Could goto page: ${error}!`);
				success = false;
			}

			if (!success) {
				this.#logger.info(`Exiting bench unsuccessfully.`);
				if (cleanup) {
					this.cleanup();
				}
				return;
			}

			// Scrape if required.
			if (scrape) {
				// For saving everything.
				const name = `${this.#id}_${this.#actionCount}`;

				// Metadata.
				let metadata;
				try {
					const userAgent = await this.#browser.userAgent();
					const scrapedUrl = await this.#page.url();
					const commitHash = await getCommitHash({ logger: this.#logger });
					metadata = {
						action_count: this.#actionCount,
						bench_id: this.#id,
						git_commit_hash: commitHash,
						requested_at: new Date(start).toISOString(),
						scraped_at: new Date(Date.now()).toISOString(),
						url_requested: url,
						url_scraped: scrapedUrl,
						user_agent: userAgent,
						viewport_height: this.#height,
						viewport_width: this.#width,
						wait,
					};
					writeFileSync(
						`./${this.#baseSourcePath}.json`,
						JSON.stringify(metadata, null, 2),
					);
				} catch (error) {
					this.#logger.error(`Could not write metadata: ${error}!`);
					success = false;
				}

				if (!success) {
					this.#actionCount++;
					this.#logger.info(`Exiting bench unsuccessfully.`);
					if (cleanup) {
						await this.cleanup();
					}
					return;
				}

				try {
					// Screenshot.
					await this.#page.screenshot({
						fullPage: true,
						path: `./${this.#baseSourcePath}-screenshot.jpg`,
					});

					// Thumbnail.
					const thumb = sharp(`${this.#baseSourcePath}-screenshot.jpg`);
					const resizedThumb = await thumb.resize(
						Math.round(this.#width / 3),
						Math.round(this.#height / 3),
						{
							fit: "cover",
							position: "top",
						},
					);
					await resizedThumb.toFile(`${this.#baseSourcePath}-thumbnail.jpg`);
				} catch (error) {
					this.#logger.error(`Could not write images: ${error}!`);
					success = false;
				}

				if (!success) {
					this.#actionCount++;
					this.#logger.info(`Exiting bench unsuccessfully.`);
					if (cleanup) {
						await this.cleanup();
					}
					return;
				}

				try {
					// HTML.
					const html = await this.#page.content();
					writeFileSync(`./${this.#baseSourcePath}.txt`, html);
				} catch (error) {
					this.#logger.error(`Could not write HTML: ${error}!`);
					success = false;
				}

				if (!success) {
					this.#actionCount++;
					if (cleanup) {
						await this.cleanup();
					}
					this.#logger.info(`Exiting bench unsuccessfully.`);
					return;
				}

				// Write and get the scrape metatdata record.
				const scrapeMetaRecord = await this.#recorder.saveScrapeMeta(metadata);
				result = scrapeMetaRecord;

				if (!result) {
					this.#actionCount++;
					this.#logger.info(`Exiting bench unsuccessfully.`);
					if (cleanup) {
						await this.cleanup();
					}
					return;
				}

				// Write and get the scrape content record(s).
				for (const channel of this.#channels) {
					const baseTargetPath = `scrapes/${name}`;
					await channel.put({
						source: `${this.#baseSourcePath}.json`,
						target: `${baseTargetPath}.json`,
					});
					await channel.put({
						source: `${this.#baseSourcePath}-thumbnail.jpg`,
						target: `${baseTargetPath}-thumbnail.jpg`,
					});
					await channel.put({
						source: `${this.#baseSourcePath}-screenshot.jpg`,
						target: `${baseTargetPath}-screenshot.jpg`,
					});
					await channel.put({
						source: `${this.#baseSourcePath}.txt`,
						target: `${baseTargetPath}.txt`,
					});
					const scrapeResultRecord = await this.#recorder.saveScrapeResult({
						scrape_meta_id: scrapeMetaRecord.id,
						channel_name: channel.name,
						html_location: `${baseTargetPath}.txt`,
						metadata_location: `${baseTargetPath}.json`,
						screenshot_location: `${baseTargetPath}-screenshot.jpg`,
						thumbnail_location: `${baseTargetPath}-thumbnail.jpg`,
						root_location: channel.base,
					});
				}
				const end = Date.now();
				this.#logger.info(
					`Completed goto action for "${url}" after ${end - start}ms.`,
				);
				this.#actionCount++;
				if (cleanup) {
					await this.cleanup();
				}
				return result;
			} // End if scrape.
		}
	}
}
