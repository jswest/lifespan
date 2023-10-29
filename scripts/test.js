import Bench from "./../lib/bench.js";

(async () => {
	const bench = new Bench();
	await bench.act({
		action: "goto",
		details: { url: "http://beebe-west.com/john" },
		scrape: true,
	});
	await bench.cleanup();
})();
