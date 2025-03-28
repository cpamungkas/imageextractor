# Image Metadata Extractor

A web-based tool that extracts and displays metadata from images directly in your browser. This application allows users to drag and drop or select image files to view detailed information, including EXIF data, without uploading the images to any server.

![image](https://github.com/user-attachments/assets/891d60c9-4874-4946-b2d1-bcc67c48136b)


## Features

- 📷 Extract basic image information (filename, size, type, dimensions)
- 🔍 Extract EXIF metadata from JPEG images
- 📱 Responsive design for desktop and mobile devices
- 🖱️ Drag-and-drop interface for easy file selection
- 🔒 Client-side processing (no server uploads, preserving privacy)
- 📊 Organized metadata display in categories
- 🔄 Advanced metadata toggle for viewing all available information

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Lucide React](https://lucide.dev/) - Icon library

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/image-metadata-extractor.git
   cd image-metadata-extractor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Open the application in your web browser.
2. Drag and drop an image file onto the designated area, or click to browse and select a file.
3. The application processes the image and displays its metadata.
4. For JPEG images with EXIF data, additional information like camera settings will be displayed.
5. Click "Show Advanced Metadata" to view all extracted metadata fields.

## How It Works

The application uses JavaScript's built-in APIs to extract metadata from images:

1. Basic file information is extracted using the File API.
2. Image dimensions are determined by loading the image into an HTML Image element.
3. EXIF data is extracted by parsing the binary data of JPEG files.
4. All processing happens client-side in the browser, ensuring privacy.

## Privacy

This application processes all images locally in your browser. No image data is ever sent to a server, ensuring complete privacy.

## Limitations

- EXIF extraction is currently limited to JPEG images.
- Some proprietary metadata formats may not be fully supported.
- GPS location data display requires valid EXIF location information.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ExifReader](https://github.com/mattiasw/ExifReader)

