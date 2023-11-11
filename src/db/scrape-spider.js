import { shelf } from "./db.js";
import Scrape from "./scrape.js";
import Spider from "./spider.js";

const ScrapeSpider = shelf.model("ScrapeSpider", {
	tableName: "scrapes_spiders",
	scrape() {
		return this.hasOne(Scrape);
	},
	spider() {
		return this.belongsTo(Spider);
	},
});

export default ScrapeSpider;
