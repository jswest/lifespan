import { shelf } from "./db.js";
import Scrape from "./scrape.js";
import Attempt from "./attempt.js";

const Spider = shelf.model("Spider", {
	tableName: "spiders",
	attempts() {
		return this.hasMany(Attempt);
	},
	base_scrape() {
		return this.belongsTo(Scrape, 'base_scrape_id');
	},
});

export default Spider;
