# NFT Image and Metadata Generator

This project is a Node.js application that generates NFT images with random backgrounds and corresponding metadata. It uploads the generated images and metadata to Pinata, a service for managing IPFS (InterPlanetary File System) content.

## Features

- Generates images with random colored backgrounds.
- Creates metadata for each NFT image.
- Uploads images and metadata to Pinata.
- Supports configuration through environment variables.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)
- Pinata account (for uploading images and metadata)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Pinata credentials:

   ```plaintext
   PINATA_JWT=<your-pinata-jwt>
   PINATA_GATEWAY=<your-pinata-gateway>
   IMAGE_COUNT=5  # Number of images to generate
   ```

## Usage

To run the application, execute the following command:


## Troubleshooting

- If you encounter an error about the canvas library, you may need to install the necessary dependencies.

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```
