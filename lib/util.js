export const config = {
	viewport: {
		height: 1000,
		width: 1600,
	},
	userAgent: "default", // "default", "none", or an arbitrary string.
	wait: 500,
};

export function slugify(text) {
	return text
		.split(" ")
		.map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
		.join("-");
}
