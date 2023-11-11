import { shelf } from "./db.js";
import Scrape from './scrape.js';
import Spider from './spider.js';

const Attempt = shelf.model("Attempt", {
	tableName: "scrape_attempts",
	scrape() {
		return this.hasOne(Scrape);
	},
	spider() {
		return this.belongsTo(Spider);
	}
});

export default Attempt