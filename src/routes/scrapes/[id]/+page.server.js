import Scrape from "./../../../db/scrape.js";

export async function load({ params }) {
	const id = params.id;

	const scrape = await Scrape.forge({ id: id }).fetch({
		withRelated: ["attempt", "assets"],
	});

	return {
		scrape: scrape.toJSON(),
	};
}
