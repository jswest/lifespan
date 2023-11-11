import Attempt from "./../../db/attempt.js";

export async function load() {
	const attempts = await Attempt.fetchAll({
		withRelated: [
			"scrape",
			"scrape.assets",
		],
	});

	return {
		attempts: attempts.toJSON(),
	};
}
