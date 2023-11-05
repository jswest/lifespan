import "dotenv/config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
	region: "us-east-1",
});

export async function GET({ url }) {
	const key = url.searchParams.get("key");

	const command = new GetObjectCommand({
		Bucket: process.env.AWS_S3_BUCKET_NAME,
		Key: key,
	});

	const response = await client.send(command);
	const body = await response.Body.transformToByteArray();

	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": "image/jpeg",
		},
	});
}
