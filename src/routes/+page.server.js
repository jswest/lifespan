import { db } from "./../db/db.js";

export async function load({ params }) {
	const [{ attempts_count }] = await db
		.select(db.raw("count(DISTINCT id)::numeric AS attempts_count"))
		.from("scrape_attempts");
	const [{ scrapes_count }] = await db
		.select(db.raw("count(DISTINCT id)::numeric AS scrapes_count"))
		.from("scrapes");
	const [{ spiders_count }] = await db
		.select(db.raw("count(DISTINCT id)::numeric AS spiders_count"))
		.from("spiders");
	return {
		attemptsCount: attempts_count,
		scrapesCount: scrapes_count,
		spidersCount: spiders_count,
	};
}
