import { shelf } from "./db.js";
import Scrape from "./scrape.js";

const Spider = shelf.model("Spider", {
	tableName: "spiders",
	baseScrape() {
		return this.hasOne(Scrape);
	},
});

export default Spider;
