import Spider from "./../../db/spider.js";
import { db } from "./../../db/db.js";

export async function load() {
	const spiders = await Spider.fetchAll({
		withRelated: [
			"attempts",
			"base_scrape",
			"base_scrape.attempt",
			{
				"base_scrape.assets": (qb) => {
					qb.where("channel_name", "s3");
				},
			},
		],
	});

	return {
		spiders: spiders.toJSON(),
	};
}
