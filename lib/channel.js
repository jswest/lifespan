import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { config, getLogger } from "./util.js";

export default class Channel {
	#logger;

	#name;

	#bucketName;
	#client;
	#root;

	constructor({ details, name }) {
		if (!config.channelNames.includes(name)) {
			const error = 'You must pass a valid "name" to Channel!';
			this.#logger.error(error);
			throw new Error(error);
		}
		this.#name = name;
		this.#logger = getLogger({ name: `channel-${this.#name}` });

		if (name === "fs") {
			const { root } = details;
			if (!root) {
				const error = "You must pass an absolute path as root to Channel!";
				this.#logger.error(error);
				throw new Error(error);
			}
			this.#root = root;
		} else if (name === "s3") {
			const { bucketName, accessKeyId, secretAccessKey } = details;
			if (!bucketName) {
				const error = "You must pass an AWS Bucket name to Channel!";
				this.#logger.error(error);
				throw new Error(error);
			}
			this.#bucketName = bucketName;

			this.#client = new S3Client({
				credentials: {
					accessKeyId: details.accessKeyId,
					secretAccessKey: details.secretAccessKey,
				},
				region: "us-east-1",
			});
		}
	}

	#generateDirectories (file) {
		const directory = file.split('/').slice(0, -1).join('/');
		if (!existsSync(directory)) {
			mkdirSync(directory, { recursive: true });
		}
	}

	async put({ source, target }) {
		if (this.#name === "fs") {
			try {
				const object = readFileSync(source);
				const out = `${this.#root}/${target}`
				this.#generateDirectories(out);
				writeFileSync(out, object);
				return out;
			} catch (error) {
				this.#logger.error(`Could not copy file: ${error}!`);
			}
		} else if (this.#name === "s3") {
			await this.#client.send(
				new PutObjectCommand({
					Bucket: this.#bucketName,
					Key: target,
					Body: readFileSync(source),
				}),
			);
			return target;
		}
	}
}
