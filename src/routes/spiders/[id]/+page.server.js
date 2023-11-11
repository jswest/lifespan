import Attempt from "./../../../db/attempt.js";

export async function load({ params }) {
	const attempts = await Attempt.query((qb) => {
		qb.whereExists((sqb) => {
			sqb
				.select("ss.id")
				.from("scrapes_spiders as ss")
				.leftJoin("scrapes as sc", "sc.id", "ss.scrape_id")
				.whereRaw("sc.scrape_attempt_id = scrape_attempts.id")
				.andWhere("ss.spider_id", "=", params.id)
		});
		qb.orderBy('created_at', 'desc');
	}).fetchAll({
		withRelated: ["scrape", "scrape.assets", "scrape.scrape_spider"],
	});

	return {
		attempts: attempts.toJSON(),
	};
}
