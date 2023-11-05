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

	async getScrapeById({ id }) {
		const {
			rows: [scrape],
		} = await this.#query(
			`
			SELECT
				sm.*,
				sr.id AS scrape_result_id,
				sr.created_at AS crape_result_created_at,
				sr.channel_name,
				sr.html_location,
				sr.metadata_location,
				sr.root_location,
				sr.screenshot_location,
				sr.thumbnail_location	
			FROM scrape_metas AS sm
			LEFT JOIN scrape_results AS sr ON sr.scrape_meta_id = sm.id
			WHERE sm.id = $1
			ORDER BY sr.channel_name DESC
			LIMIT 1;
			`,
			[id],
		);
		return scrape;
	}

	async saveSpider(data) {
		const {
			rows: [spider],
		} = await this.#query(
			`
			INSERT INTO public.spiders (
				base_scrape_id,
				delay,
				ideal_length,
				is_local_only,
				level,
				url_node
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING *;
			`,
			[
				data.base_scrape_id,
				data.delay,
				data.ideal_length,
				data.is_local_only,
				data.level,
				data.url_node,
			],
		);
		return spider;
	}

	async saveScrapeSpider(data) {
		const {
			rows: [scrapeSpider],
		} = await this.#query(
			`
			INSERT INTO public.scrapes_spiders (
				scrape_id,
				spider_id
			) VALUES ($1, $2)
			RETURNING *;
			`,
			[
				data.scrape_id,
				data.spider_id,
			],
		);
		return scrapeSpider;
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
				metadata_location,
				root_location,
				screenshot_location,
				thumbnail_location
			) VALUES ( $1, $2, $3, $4, $5, $6, $7)
			RETURNING *
			`,
			[
				result.scrape_meta_id,
				result.channel_name,
				result.html_location,
				result.metadata_location,
				result.root_location,
				result.screenshot_location,
				result.thumbnail_location,
			],
		);
	}
}
