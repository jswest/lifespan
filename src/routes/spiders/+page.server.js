import { db } from "$lib/db/db.js";

export async function load() {
	const spiders = await db
		.select([
			"sp.id",
			"sp.created_at",
			"sp.base_scrape_id",
			"sp.delay",
			"sp.ideal_length",
			"sp.is_local_only",
			"sp.level",
			"sp.url_node",
			"sm.git_commit_hash",
			"sm.requested_at",
			"sm.scraped_at",
			"sm.url_requested",
			"sm.url_scraped",
			"sm.user_agent",
			"sm.viewport_height",
			"sm.viewport_width",
			"sm.wait",
			"sr.html_location",
			"sr.metadata_location",
			"sr.root_location",
			"sr.screenshot_location",
			"sr.thumbnail_location",
			db.raw("count(DISTINCT ss.id)::numeric AS scrapes_count")
		])
		.from("spiders AS sp")
		.leftJoin("public.scrape_metas AS sm", "sm.id", "sp.base_scrape_id")
		.leftJoin("public.scrapes_spiders AS ss", "ss.spider_id", "sp.id")
		.leftJoin("public.scrape_results AS sr", "sr.scrape_meta_id", "sm.id")
		.where("sr.channel_name", "s3")
		.groupBy([
			"sp.id",
			"sp.created_at",
			"sp.base_scrape_id",
			"sp.delay",
			"sp.ideal_length",
			"sp.is_local_only",
			"sp.level",
			"sp.url_node",
			"sm.git_commit_hash",
			"sm.requested_at",
			"sm.scraped_at",
			"sm.url_requested",
			"sm.url_scraped",
			"sm.user_agent",
			"sm.viewport_height",
			"sm.viewport_width",
			"sm.wait",
			"sr.html_location",
			"sr.metadata_location",
			"sr.root_location",
			"sr.screenshot_location",
			"sr.thumbnail_location",
		])
		.orderBy("sp.created_at", "desc");

	return {
		spiders
	}
}
