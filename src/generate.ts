import dotenv from "dotenv";
dotenv.config();

import { fileURLToPath } from "url";
import { dirname } from "path";
import { createCanvas } from "canvas";
import { promises as fs } from "fs";
import * as path from "path";
import { PinataSDK } from "pinata-web3";

const __filename = fileURLToPath(
  new URL("./", "file://" + process.cwd() + "/")
);
const __dirname = dirname(__filename);

// brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "blush-used-hamster-371.mypinata.cloud",
});

interface NftTrait {
  trait_type: string;
  value: string;
}

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NftTrait[];
}

// Configuration
const OUTPUT_DIR = path.join(__dirname, "output");
const IMAGE_COUNT = process.env.IMAGE_COUNT || 5;
const WIDTH = 512;
const HEIGHT = 512;

// A simple helper to pick a random background color
function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Generate a single image with a random colored background
async function generateImage(tokenId: number): Promise<string> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const bgColor = getRandomColor();
  // Fill the canvas with the background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Add some random shapes or text if desired
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 50px Sans";
  ctx.fillText(`NFT #${tokenId}`, WIDTH / 4, HEIGHT / 2);

  const imagePath = path.join(OUTPUT_DIR, `images`, `${tokenId}.png`);
  await fs.writeFile(imagePath, canvas.toBuffer("image/png"));
  return imagePath;
}

// Upload images to Pinata and return an array of image IPFS URIs
async function uploadImagesToPinata(): Promise<string[]> {
  const imageDir = path.join(OUTPUT_DIR, "images");
  const files = await fs.readdir(imageDir);

  // Pin each image individually. Alternatively, you could pin the entire directory at once.
  const imageUris: string[] = [];
  for (const f of files) {
    const filePath = path.join(imageDir, f);
    const readableStream = await fs.readFile(filePath);
    const file = new File([readableStream], `${f}.png`, {
      type: "image/png",
    });
    const pinResponse = await pinata.upload.file(file);
    console.log(pinResponse);
    imageUris.push(`ipfs://${pinResponse.IpfsHash}`);
  }
  return imageUris;
}

// Generate metadata for each token
async function generateMetadata(imageUris: string[]): Promise<void> {
  const metaDir = path.join(OUTPUT_DIR, "metadata");
  await fs.mkdir(metaDir, { recursive: true });

  for (let i = 0; i < imageUris.length; i++) {
    const tokenId = i;
    const attributes: NftTrait[] = [
      {
        trait_type: "BackgroundColor",
        value: "RandomColor", // Could store the actual random color if desired
      },
    ];

    const metadata: NftMetadata = {
      name: `My NFT #${tokenId}`,
      description: `This is the description for NFT #${tokenId}.`,
      image: imageUris[i],
      attributes,
    };

    const metaPath = path.join(metaDir, `${tokenId}.json`);
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), "utf8");
  }
}

// Upload metadata directory to Pinata
async function uploadMetadataDirectory(): Promise<string> {
  const metaDir = path.join(OUTPUT_DIR, "metadata");

  // load all files in the metadata directory
  const files = await fs.readdir(metaDir);
  const fileArray = files.map((file) => path.join(metaDir, file));
  // create a file object for each file
  const fileObjects = await Promise.all(
    fileArray.map(async (file, index) => {
      const readableStream = await fs.readFile(file);
      return new File([readableStream], `${index}.json`, {
        type: "application/json",
      });
    })
  );
  const pinResponse = await pinata.upload.fileArray(fileObjects);

  console.log("Following metadata was pinned:", pinResponse);

  return `ipfs://${pinResponse.IpfsHash}`;
}

async function main() {
  // Ensure output directories exist
  await fs.mkdir(path.join(OUTPUT_DIR, "images"), { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, "metadata"), { recursive: true });

  // 1. Generate Images
  for (let i = 0; i < IMAGE_COUNT; i++) {
    await generateImage(i);
  }

  // 2. Upload images to Pinata
  const imageUris = await uploadImagesToPinata();

  // 3. Generate Metadata
  await generateMetadata(imageUris);

  // 4. Upload Metadata Directory to Pinata
  const metadataBaseUri = await uploadMetadataDirectory();

  console.log(`Metadata Base URI: ${metadataBaseUri}`);
  console.log(
    `Example token metadata URL: https://gateway.pinata.cloud/ipfs/${metadataBaseUri.replace(
      "ipfs://",
      ""
    )}/0.json`
  );
}

main().catch(console.error);
