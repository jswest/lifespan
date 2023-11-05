import { db } from "$lib/db/db.js";

export async function load({ params }) {
	const id = params.id;
	const [scrape] = await db
		.select([
			"sm.*",
			"sr.html_location",
			"sr.metadata_location",
			"sr.root_location",
			"sr.screenshot_location",
			"sr.thumbnail_location",
		])
		.from("public.scrape_metas AS sm")
		.leftJoin("public.scrape_results AS sr", "sr.scrape_meta_id", "sm.id")
		.where("sr.channel_name", "s3")
		.where("sm.id", id)
		.limit(1);

	return {
		scrape,
	};
}
