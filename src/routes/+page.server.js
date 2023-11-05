import { db } from "$lib/db/db.js";

export async function load({ params }) {
	const [{ scrapes_count }] = await db
		.select(db.raw("count(DISTINCT id)::numeric AS scrapes_count"))
		.from("scrape_metas");
	const [{ spiders_count }] = await db
		.select(db.raw("count(DISTINCT id)::numeric AS spiders_count"))
		.from("spiders");
	return {
		scrapesCount: scrapes_count,
		spidersCount: spiders_count,
	};
}
