import "dotenv/config";
import { createHash } from "crypto";
import { writeFileSync } from "fs";
import puppeteer from "puppeteer";
import { v4 as uuid } from "uuid";
import winston from "winston";

import { config, slugify } from "./util.js";

export default class Bench {
	#logger;

	#actionCount = 0;

	#browser;
	#page;

	#height;
	#width;
	#userAgent;

	#id;

	constructor({ userAgent, viewport } = {}) {
		// Initialize the logger.
		const transports = [
			new winston.transports.File({ filename: "./log/combined.log" }),
		];
		if (process.env.ENVIRONMENT !== "production") {
			transports.push(
				new winston.transports.Console({ format: winston.format.simple() }),
			);
		}
		this.#logger = winston.createLogger({
			level: "info",
			format: winston.format.json(),
			transports,
		});

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
		this.#logger.info(`Bench instance created with id "${this.#id}"`);
	}

	get id() {
		return this.#id;
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
			this.#logger.error("Coult not prepare!", error);
			await this.cleanup();
		}
	}

	async cleanup() {
		try {
			if (this.#browser) {
				await this.#browser.close();
			}
		} catch (error) {
			this.#logger.error("Could not clean up!", error);
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
					const name = `${this.#id}_${this.#actionCount}`;
					await this.#page.screenshot({
						fullPage: true,
						path: `./temp/${name}.jpg`,
					});
					const html = await this.#page.content();
					writeFileSync(`./temp/${name}.html.txt`, html);
					this.#logger.info(`Scrape completed at ${name}.`);
				}
				const end = Date.now();
				this.#logger.info(
					`Completed goto action for "${url}" after ${end - start}ms.`,
				);
			} catch (error) {
				this.#logger.error("Could not goto page!", error);
				await this.cleanup();
			} finally {
				this.#actionCount++;
			}
		}
	}
}
