import { shelf } from "./db.js";
import Scrape from './scrape.js';

const Attempt = shelf.model("Attempt", {
	tableName: "scrape_attempts",
	scrape() {
		return this.hasOne(Scrape);
	},
});

export default Attempt