import Image from "next/image";

interface ProductImagesProps {
  images: string[];
  selectedImage: number;
  setSelectedImage: (index: number) => void;
  productTitle: string;
}

export default function ProductImages({ images, selectedImage, setSelectedImage, productTitle }: ProductImagesProps) {
  // Filter out duplicate image URLs
  const uniqueImages = Array.from(new Set(images));
  return (
    <>
      {/* Main image */}
      <div className="mb-3">
        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 max-w-sm mx-auto lg:max-w-none lg:mx-0">
          <Image
            src={uniqueImages[selectedImage]}
            alt={productTitle}
            width={400}
            height={533}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>
      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto lg:max-w-none lg:mx-0">
        {uniqueImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`aspect-[3/4] rounded-md overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-indigo-600' : 'border-gray-200'}`}
          >
            <Image
              src={image}
              alt={`${productTitle} - View ${index + 1}`}
              width={80}
              height={107}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </>
  );
} 