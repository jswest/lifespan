import { shelf } from "./db.js";
import Scrape from "./scrape.js";
import ScrapeSpider from "./scrape-spider.js";

const Spider = shelf.model("Spider", {
	tableName: "spiders",
	base_scrape() {
		return this.belongsTo(Scrape, 'base_scrape_id');
	},
	scrapes_spiders() {
		return this.hasMany(ScrapeSpider);
	},
});

export default Spider;
