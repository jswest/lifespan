import Attempt from "./../../../db/attempt.js";

export async function load({ params }) {
	const base = await Attempt.query((qb) => {
		qb.whereExists((sqb) => {
			sqb
				.select("sc.scrape_attempt_id")
				.from("scrapes as sc")
				.leftJoin("spiders AS sp", "sp.base_scrape_id", "sc.id")
				.whereRaw("sc.scrape_attempt_id = scrape_attempts.id")
				.andWhere("sp.id", "=", params.id);
		});
	}).fetch({
		withRelated: ["scrape", "scrape.assets"],
	});

	const attempts = await Attempt.query((qb) => {
		qb.where("spider_id", params.id);
		qb.orderBy("created_at");
	}).fetchAll({
		withRelated: ["scrape", "scrape.assets"],
	});

	return {
		attempts: attempts.toJSON(),
		base: base.toJSON(),
	};
}
