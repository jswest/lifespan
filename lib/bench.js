import "dotenv/config";
import { createHash } from "crypto";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

import Asset from "./../db/asset.js";
import Attempt from "./../db/attempt.js";
import Scrape from "./../db/scrape.js";
import { config, getCommitHash, getLogger, slugify } from "./util.js";

export default class Bench {
	#logger;

	#channels;

	#attemptData;
	#scrapeData;

	#asset;
	#attempt;
	#scrape;

	#actionCount = 0;
	#baseSourcePath = `temp/temp`;

	#browser;
	#page;

	#start;
	#end;
	#url;
	#wait;

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
		this.#asset = null;
		this.#attempt = null;
		this.#scrape = null;
		this.#start = null;
		this.#url = null;
		this.#wait = null;
		try {
			if (!this.#browser || !this.#page) {
				this.#browser = await puppeteer.launch({
					headless: "new",
					executablePath: process.env.CHROMIUM_PATH,
				});
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

	async #saveMetadata() {
		const metadata = {
			attempt: this.#attemptData,
			scrape: this.#scrapeData,
		};
		writeFileSync(
			`${this.#baseSourcePath}.json`,
			JSON.stringify(metadata, null, 2),
		);
	}

	async #saveAttempt({
		attemptedAt,
		errors,
		gitCommitHash,
		urlRequested,
		userAgent,
		viewportHeight,
		viewportWidth,
	}) {
		let attempt;
		try {
			attempt = Attempt.forge({
				attempted_at: attemptedAt,
				errors: errors,
				git_commit_hash: gitCommitHash,
				url_requested: urlRequested,
				user_agent: userAgent,
				viewport_height: viewportHeight,
				viewport_width: viewportWidth,
			});
			const res = await attempt.save();
		} catch (error) {
			this.#logger.error(
				`Could not save the attempt to the database: ${error}!`,
			);
		} finally {
			return attempt;
		}
	}

	async #saveScrape({ attemptId, scrapedAt, urlScraped }) {
		let scrape;
		try {
			scrape = Scrape.forge({
				scrape_attempt_id: attemptId,
				scraped_at: scrapedAt,
				url_scraped: urlScraped,
			});
			await scrape.save();
		} catch (error) {
			this.#logger.error(
				`Could not save the scrape to the database: ${error}!`,
			);
		} finally {
			return scrape;
		}
	}

	async #saveAsset({
		scrapeId,
		channelName,
		htmlLocation,
		metadataLocation,
		rootLocation,
		screenshotLocation,
		thumbnailLocation,
	}) {
		let asset;
		try {
			asset = Asset.forge({
				scrape_id: scrapeId,
				channel_name: channelName,
				html_location: htmlLocation,
				metadata_location: metadataLocation,
				root_location: rootLocation,
				screenshot_location: screenshotLocation,
				thumbnail_location: thumbnailLocation,
			});
			await asset.save();
		} catch (error) {
			this.#logger.error(`Could not save the asset to the database: ${error}!`);
		} finally {
			return asset;
		}
	}

	async goto({ details }) {
		this.#url = details?.url;
		this.#wait = details?.wait || config.wait;

		if (!this.#url) {
			throw new Error('No URL passed for the action "gogo"!');
			return { success: false };
		}

		let result;
		this.#logger.info(`Begun goto action for "${this.#url}".`);
		this.#start = Date.now();

		if (this.#userAgent && this.#userAgent !== "default") {
			try {
				this.#logger.info(`Setting user-agent string to "${this.#userAgent}".`);
				await this.#page.setUserAgent(this.#userAgent);
			} catch (error) {
				this.#logger.error(`Could not set user-agent string: ${error}!`);
				return { success: false };
			}
		}

		try {
			this.#logger.info(`Actually going to URL "${this.#url}".`);
			await this.#page.goto(this.#url, { waitUntil: "networkidle2" });
		} catch (error) {
			this.#logger.error(`Could not goto URL: ${error}!`);
			return { success: false, error: error };
		}

		try {
			this.#logger.info(`Waiting just a bit longer, "${this.#wait}ms".`);
			await this.#page.waitForTimeout(this.#wait);
		} catch (error) {
			this.#logger.error(`Could not wait: ${error}!`);
			return { success: false };
		}

		this.#end = Date.now();
		this.#logger.info(`Ended goto action for "${this.#url}".`);

		return { success: true };
	}

	async act({ action, cleanup, details, scrape } = {}) {
		// Make ready a way in the desert!
		await this.prepare();

		// If the action is "goto" or null, which means "goto" as a default.
		if (!action || action == "goto") {
			// Get the goto response.
			const goto = await this.goto({ details });

			// If it's successful of if there's an error message, and if we're supposed to scrape.
			if ((goto.success || goto.error) && scrape) {
				// Get the git commit hash.
				let gitCommitHash;
				try {
					gitCommitHash = await getCommitHash({ logger: this.#logger });
				} catch (error) {
					this.#logger.error(`Could not get the git commit hash: ${error}!`);
				}

				// Get the user-agent string.
				let userAgent;
				try {
					userAgent = await this.#browser.userAgent();
				} catch (error) {
					this.#logger.error(`Could not get the user agent string: ${error}!`);
				}

				// Make the attempt data for the database and the methodology JSON.
				this.attemptData = {
					actionCount: this.#actionCount,
					attemptedAt: new Date(this.#start).toISOString(),
					gitCommitHash,
					urlRequested: this.#url,
					userAgent,
					viewportHeight: this.#height,
					viewportWidth: this.#width,
					wait: this.#wait,
				};

				// Save the attempt to the database.
				this.#attempt = await this.#saveAttempt(this.attemptData);
			}

			// If we were uncessful, exit.
			if (!goto.success || !this.#attempt) {
				this.#logger.info(`Exiting bench unsuccessfully.`);
				if (cleanup) {
					this.cleanup();
				}
				return;
			}
		}

		// Time to save the scrape itself.
		if (scrape) {
			let urlScraped;
			try {
				urlScraped = this.#page.url();
			} catch (error) {
				this.#logger.error(`Could not the URL of the page: ${error}!`);
			}

			this.scrapeData = {
				attemptId: this.#attempt.attributes.id,
				scrapedAt: new Date(this.#end).toISOString(),
				urlScraped: this.#page.url(),
			};
			this.#scrape = await this.#saveScrape(this.scrapeData);
			this.#saveMetadata();

			if (!this.#scrape) {
				this.#actionCount++;
				this.#logger.info(`Exiting bench unsuccessfully.`);
				if (cleanup) {
					this.cleanup();
				}
				return;
			}

			// Let's try to take a screenshot.
			let screenshot = false;
			try {
				// Screenshot.
				await this.#page.screenshot({
					fullPage: true,
					path: `./${this.#baseSourcePath}-screenshot.jpg`,
				});
				screenshot = true;
			} catch (error) {
				this.#logger.error(`Could not screenshot: ${error}!`);
			}

			if (!screenshot) {
				this.#actionCount++;
				this.#logger.info(`Exiting bench unsuccessfully.`);
				if (cleanup) {
					this.cleanup();
				}
				return;
			}

			// Let's try to resize the thumbnail.
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

			try {
				// HTML.
				const html = await this.#page.content();
				writeFileSync(`./${this.#baseSourcePath}.txt`, html);
			} catch (error) {
				this.#logger.error(`Could not write HTML: ${error}!`);
				this.#actionCount++;
				if (cleanup) {
					await this.cleanup();
				}
				this.#logger.info(`Exiting bench unsuccessfully.`);
				return;
			}

			// Write and get the scrape content record(s).
			for (const channel of this.#channels) {
				const name = `${this.#id}_${this.#actionCount}`;
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
				this.#asset = await this.#saveAsset({
					scrapeId: this.#scrape.attributes.id,
					channelName: channel.name,
					htmlLocation: `${baseTargetPath}.txt`,
					metadataLocation: `${baseTargetPath}.json`,
					rootLocation: channel.base,
					screenshotLocation: `${this.#baseSourcePath}-screenshot.jpg`,
					thumbnailLocation: `${baseTargetPath}-thumbnail.jpg`,
				});
				if (!this.#asset) {
					this.#actionCount++;
					this.#logger.info(`Exiting bench unsuccessfully.`);
					if (cleanup) {
						this.cleanup();
					}
					return;
				}
			}
			this.#logger.info(
				`Completed action for after ${Date.now() - this.#start}ms.`,
			);
			this.#actionCount++;
			if (cleanup) {
				await this.cleanup();
			}
			return this.#scrape.attributes.id;
		}
	}
}
