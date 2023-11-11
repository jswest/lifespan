import Attempt from "./../../../db/attempt.js";

export async function load({ params }) {
	const attempts = await Attempt.query((qb) => {
		qb.where("spider_id", params.id);
		qb.orderBy('created_at', 'desc');
	}).fetchAll({
		withRelated: ["scrape", "scrape.assets",],
	});

	return {
		attempts: attempts.toJSON(),
	};
}
