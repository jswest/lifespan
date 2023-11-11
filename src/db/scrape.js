import { shelf } from "./db.js";
import Asset from "./asset.js";
import Attempt from "./attempt.js";
import Spider from "./spider.js";
import ScrapeSpider from "./scrape-spider.js";

const Scrape = shelf.model("Scrape", {
	tableName: "scrapes",
	assets() {
		return this.hasMany(Asset);
	},
	attempt() {
		return this.belongsTo(Attempt);
	},
	spider() {
		return this.hasOne(Spider);
	},
	scrape_spider() {
		return this.hasOne(ScrapeSpider)
	}
});

export default Scrape;
