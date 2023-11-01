import "dotenv/config";
import pg from "pg";

import { getLogger } from "./util.js";

export default class Recorder {
	#logger;

	constructor() {
		// Initialize the logger.
		this.#logger = getLogger({ name: "recorder" });
	}

	async #query(query, params) {
		let client;

		// Try to connect to the db.
		try {
			client = new pg.Client({
				ssl: {
					rejectUnauthorized: false,
				},
			});
			await client.connect();
		} catch (error) {
			this.#logger.error(`Could not connect to client: ${error}!`);
			return;
		}

		// Try to make the query.
		try {
			this.#logger.info("Making database query.");
			const result = await client.query(query, params);
			return result;
		} catch (error) {
			this.#logger.error(`Could not make query: ${error}!`);
		} finally {
			await client.end();
		}
	}

	async saveScrapeMeta(metadata) {
		const {
			rows: [scrapeMeta],
		} = await this.#query(
			`
			INSERT INTO public.scrape_metas (
				git_commit_hash,
				requested_at,
				scraped_at,
				url_requested,
				url_scraped,
				user_agent,
				viewport_height,
				viewport_width,
				wait
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING *;
			`,
			[
				metadata.git_commit_hash,
				metadata.requested_at,
				metadata.scraped_at,
				metadata.url_requested,
				metadata.url_scraped,
				metadata.user_agent,
				metadata.viewport_height,
				metadata.viewport_width,
				metadata.wait,
			],
		);
		return scrapeMeta;
	}

	async saveScrapeResult(result) {
		const {
			rows: [scrapeResult],
		} = await this.#query(
			`
			INSERT INTO public.scrape_results (
				scrape_meta_id,
				channel_name,
				html_location,
				image_location,
				metadata_location,
				root_location	
			) VALUES ( $1, $2, $3, $4, $5, $6)
			RETURNING *
			`,
			[
				result.scrape_meta_id,
				result.channel_name,
				result.html_location,
				result.image_location,
				result.metadata_location,
				result.root_location,
			],
		);
	}
}
